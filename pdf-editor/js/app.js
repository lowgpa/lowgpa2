
// App State
const state = {
    pdfDoc: null,
    file: null,
    scale: 1.5,
    totalPages: 0,
    activeTool: 'cursor', // cursor, text, image, draw, sign, whiteout
    pages: [], // { pageIndex, rotation, container, drawCanvas, textLayer }
    currentPdfBytes: null,
    isDrawing: false,
    lastDrawPos: { x: 0, y: 0 },
    brushColor: '#000000',
    brushSize: 2,
    fontColor: '#000000',
    fontSize: 16,
    fontFamily: 'Helvetica',
    dragItem: null,
    dragOffset: { x: 0, y: 0 }
};

// DOM Elements
const elements = {
    uploadContainer: document.getElementById('uploadContainer'),
    editorContainer: document.getElementById('editorContainer'),
    fileInput: document.getElementById('fileInput'),
    pdfViewer: document.getElementById('pdfViewer'),
    toolbar: document.getElementById('mainToolbar'),
    subToolbar: document.getElementById('subToolbar'),
    saveBtn: document.getElementById('saveBtn'),
    settings: {
        fontSize: document.getElementById('fontSize'),
        fontColor: document.getElementById('fontColor'),
        fontFamily: document.getElementById('fontFamily'),
        brushColor: document.getElementById('brushColor'),
        brushSize: document.getElementById('brushSize')
    }
};

// --- Initialization ---

function init() {
    setupEventListeners();
    setupTools();

    // Drag & Drop
    const dropZone = document.body;
    dropZone.addEventListener('dragover', (e) => e.preventDefault());
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });
}

function setupEventListeners() {
    elements.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    elements.saveBtn.addEventListener('click', savePdf);

    // Settings Listeners
    elements.settings.brushColor.addEventListener('input', (e) => state.brushColor = e.target.value);
    elements.settings.brushSize.addEventListener('input', (e) => state.brushSize = parseInt(e.target.value));
    elements.settings.fontColor.addEventListener('input', (e) => state.fontColor = e.target.value);
    elements.settings.fontSize.addEventListener('input', (e) => state.fontSize = parseInt(e.target.value));

    // Global Mouse Up for dragging
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('mousemove', handleDrag);
}

function setupTools() {
    const btns = elements.toolbar.querySelectorAll('.tool-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Visual toggle
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Logic switch
            const tool = btn.dataset.tool;
            switchTool(tool);
        });
    });
}

function switchTool(tool) {
    state.activeTool = tool;

    // UI Updates
    elements.subToolbar.style.display = 'none';
    document.getElementById('textOptions').style.display = 'none';
    document.getElementById('drawOptions').style.display = 'none';

    // Cursor & Layers Updates
    const drawLayers = document.querySelectorAll('.draw-layer');
    const textLayers = document.querySelectorAll('.text-layer');

    drawLayers.forEach(el => el.style.pointerEvents = 'none');
    textLayers.forEach(el => el.style.pointerEvents = 'none');
    document.body.style.cursor = 'default';

    if (tool === 'text') {
        elements.subToolbar.style.display = 'flex';
        document.getElementById('textOptions').style.display = 'flex';
        document.body.style.cursor = 'text';
        textLayers.forEach(el => el.style.pointerEvents = 'auto'); // Allow clicking to add text
    } else if (tool === 'draw') {
        elements.subToolbar.style.display = 'flex';
        document.getElementById('drawOptions').style.display = 'flex';
        document.body.style.cursor = 'crosshair';
        drawLayers.forEach(el => el.style.pointerEvents = 'auto'); // Capture drawing events
    } else if (tool === 'cursor') {
        textLayers.forEach(el => el.style.pointerEvents = 'auto'); // Allow selecting text
    } else if (tool === 'sign') {
        document.getElementById('signatureModal').style.display = 'flex';
    }
}

// --- PDF Loading ---

async function handleFile(file) {
    if (file.type !== 'application/pdf') return alert('Please upload a PDF.');

    state.file = file;
    state.currentPdfBytes = await file.arrayBuffer();

    elements.uploadContainer.style.display = 'none';
    elements.editorContainer.style.display = 'flex';
    elements.saveBtn.textContent = 'Save & Download';

    loadPdf(state.currentPdfBytes);
}

async function loadPdf(data) {
    const loadingTask = pdfjsLib.getDocument(data);
    state.pdfDoc = await loadingTask.promise;
    state.totalPages = state.pdfDoc.numPages;
    renderAllPages();
}

async function renderAllPages() {
    elements.pdfViewer.innerHTML = '';
    state.pages = [];

    for (let i = 1; i <= state.totalPages; i++) {
        await renderPage(i);
    }
}

async function renderPage(pageNum) {
    const page = await state.pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: state.scale });

    // 1. Container
    const container = document.createElement('div');
    container.className = 'pdf-page-container';
    container.style.width = `${viewport.width}px`;
    container.style.height = `${viewport.height}px`;
    container.dataset.pageNumber = pageNum;

    // 2. PDF Canvas
    const pdfCanvas = document.createElement('canvas');
    pdfCanvas.className = 'pdf-canvas';
    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;

    // 3. Draw Layer (Canvas)
    const drawCanvas = document.createElement('canvas');
    drawCanvas.className = 'draw-layer';
    drawCanvas.width = viewport.width;
    drawCanvas.height = viewport.height;

    // 4. Text Layer (Div)
    const textLayer = document.createElement('div');
    textLayer.className = 'text-layer';

    // Append
    container.appendChild(pdfCanvas);
    container.appendChild(drawCanvas);
    container.appendChild(textLayer);
    elements.pdfViewer.appendChild(container);

    // Render PDF
    await page.render({ canvasContext: pdfCanvas.getContext('2d'), viewport: viewport }).promise;

    // Attach Events
    setupDrawingEvents(drawCanvas);
    setupTextEvents(textLayer, pageNum);

    // Store refs
    state.pages.push({
        pageIndex: pageNum - 1,
        container,
        drawCanvas,
        textLayer,
        viewport
    });
}

// --- Text Tool ---

function setupTextEvents(textLayer, pageNum) {
    textLayer.addEventListener('click', (e) => {
        if (state.activeTool !== 'text' || e.target !== textLayer) return;

        // Add text at click position
        const x = e.offsetX;
        const y = e.offsetY;
        createTextField(x, y, textLayer);
    });
}

function createTextField(x, y, container, content = 'Type here') {
    const el = document.createElement('div');
    el.contentEditable = true;
    el.className = 'text-item';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = state.fontColor;
    el.style.fontSize = `${state.fontSize}px`;
    el.style.fontFamily = state.fontFamily;
    el.innerText = content;

    // Drag Start
    el.addEventListener('mousedown', (e) => {
        if (state.activeTool === 'text' || state.activeTool === 'cursor') {
            state.dragItem = el;
            state.dragOffset = {
                x: e.clientX - el.offsetLeft,
                y: e.clientY - el.offsetTop
            };
        }
    });

    // Formatting Focus
    el.addEventListener('focus', () => {
        // Update tool options to match this element's style
        // (Simplified for now)
    });

    container.appendChild(el);
    setTimeout(() => el.focus(), 0);
}

function handleDrag(e) {
    if (!state.dragItem) return;

    const x = e.clientX - state.dragOffset.x;
    const y = e.clientY - state.dragOffset.y;

    state.dragItem.style.left = `${x}px`;
    state.dragItem.style.top = `${y}px`;
}

function endDrag() {
    state.dragItem = null;
}

// --- Drawing Tool ---

function setupDrawingEvents(canvas) {
    const ctx = canvas.getContext('2d');

    canvas.addEventListener('mousedown', (e) => {
        if (state.activeTool !== 'draw') return;
        state.isDrawing = true;
        state.lastDrawPos = { x: e.offsetX, y: e.offsetY };

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = state.brushColor;
        ctx.lineWidth = state.brushSize;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!state.isDrawing || state.activeTool !== 'draw') return;

        ctx.beginPath();
        ctx.moveTo(state.lastDrawPos.x, state.lastDrawPos.y);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();

        state.lastDrawPos = { x: e.offsetX, y: e.offsetY };
    });

    canvas.addEventListener('mouseup', () => state.isDrawing = false);
    canvas.addEventListener('mouseout', () => state.isDrawing = false);
}

// --- Signature ---

const sigCanvas = document.getElementById("signaturePad");
if (sigCanvas) {
    const ctx = sigCanvas.getContext("2d");
    let sigDrawing = false;

    sigCanvas.addEventListener("mousedown", (e) => { sigDrawing = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); });
    sigCanvas.addEventListener("mousemove", (e) => {
        if (!sigDrawing) return;
        ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke();
    });
    window.addEventListener("mouseup", () => sigDrawing = false);

    window.clearSignature = () => ctx.clearRect(0, 0, 400, 200);
    window.toggleSignatureModal = (show) => document.getElementById('signatureModal').style.display = show ? 'flex' : 'none';

    window.saveSignature = () => {
        // Create an Image element from canvas
        const dataUrl = sigCanvas.toDataURL();

        // Add to center of currently visible page (simplified: first page for now)
        // Ideally we switch to "stamp" tool mode
        alert('Signature image created. Click anywhere to place it.');
        state.activeTool = 'stamp';
        state.stampImage = dataUrl;
        document.getElementById('signatureModal').style.display = 'none';

        // Enable click on text layers to place stamp
        document.querySelectorAll('.text-layer').forEach(el => {
            el.style.pointerEvents = 'auto';
            el.onclick = (e) => {
                if (state.activeTool === 'stamp') {
                    const img = document.createElement('img');
                    img.src = state.stampImage;
                    img.className = 'text-item'; // Reuse drag logic
                    img.style.position = 'absolute';
                    img.style.left = `${e.offsetX}px`;
                    img.style.top = `${e.offsetY}px`;
                    img.style.width = '150px';

                    // Drag logic
                    img.addEventListener('mousedown', (ev) => {
                        state.dragItem = img;
                        state.dragOffset = { x: ev.clientX - img.offsetLeft, y: ev.clientY - img.offsetTop };
                    });

                    e.currentTarget.appendChild(img);
                    state.activeTool = 'cursor'; // Reset
                    el.onclick = null; // Remove stamp listener
                }
            }
        });
    };
}


// --- Export ---

async function savePdf() {
    const { PDFDocument, rgb, StandardFonts } = PDFLib;

    // Load original PDF
    const pdfDoc = await PDFDocument.load(state.currentPdfBytes);
    const pages = pdfDoc.getPages();

    // It's crucial to map annotations back to *each page*
    state.pages.forEach(async (pageData, index) => {
        const pdflibPage = pages[index];
        const { width, height } = pdflibPage.getSize();

        // 1. Draw Text Annotations
        const textItems = pageData.textLayer.querySelectorAll('.text-item');
        textItems.forEach(async (item) => {
            // Coordinate Math
            // Browser: (x, y) from top-left.
            // PDF: (x, y) from bottom-left. Scale factor involved.

            // Get visual props
            const x = parseInt(item.style.left);
            const y = parseInt(item.style.top);
            const fontSize = parseInt(item.style.fontSize);
            const text = item.innerText;
            // Check if it's an image (signature) or text
            if (item.tagName === 'IMG') {
                // Embed Image
                const imgBytes = await fetch(item.src).then(res => res.arrayBuffer());
                const pdfImage = await pdfDoc.embedPng(imgBytes); // Assuming PNG

                const imgWidth = parseInt(item.style.width) || 150;
                const imgHeight = (imgWidth / pdfImage.width) * pdfImage.height;

                pdflibPage.drawImage(pdfImage, {
                    x: x / state.scale,
                    y: height - (y / state.scale) - (imgHeight / state.scale), // approx
                    width: imgWidth / state.scale,
                    height: imgHeight / state.scale
                });
            } else {
                // Embed Text
                const font = await pdfDoc.embedFont(StandardFonts.Helvetica); // Default for now
                // Color conversion hex -> rgb (simplified)

                pdflibPage.drawText(text, {
                    x: x / state.scale,
                    y: height - (y / state.scale) - (fontSize / state.scale), // Adjust for baseline
                    size: fontSize / state.scale,
                    font: font,
                    color: rgb(0, 0, 0) // Todo: parse hex color
                });
            }
        });

        // 2. Overlay Drawing Canvas
        // We can convert the drawing canvas to a PNG and draw it on top
        const canvas = pageData.drawCanvas;
        // Check if canvas is empty? (Simplification: just draw it)
        const canvasDataUrl = canvas.toDataURL('image/png');
        if (canvasDataUrl !== 'data:,') { // Not empty
            const drawingBytes = await fetch(canvasDataUrl).then(res => res.arrayBuffer());
            const drawingImage = await pdfDoc.embedPng(drawingBytes);

            pdflibPage.drawImage(drawingImage, {
                x: 0,
                y: 0,
                width: width,
                height: height
            });
        }
    });

    const pdfBytes = await pdfDoc.save();
    download(pdfBytes, "edited.pdf", "application/pdf");
}

init();
