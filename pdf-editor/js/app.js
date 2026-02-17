
// App State
const state = {
    pdfDoc: null,
    file: null,
    scale: 1.5,
    totalPages: 0,
    activeTool: 'cursor', // cursor, text, image, draw, sign, whiteout
    pages: [], // { pageIndex, rotation, div, canvas }
    annotations: [], // All added elements
    currentPdfBytes: null
};

// DOM Elements
const elements = {
    uploadContainer: document.getElementById('uploadContainer'),
    editorContainer: document.getElementById('editorContainer'),
    fileInput: document.getElementById('fileInput'),
    pdfViewer: document.getElementById('pdfViewer'),
    toolbar: document.getElementById('mainToolbar'),
    subToolbar: document.getElementById('subToolbar'),
    toolOptions: {
        text: document.getElementById('textOptions'),
        draw: document.getElementById('drawOptions')
    },
    saveBtn: document.getElementById('saveBtn')
};

// Initialize
function init() {
    setupEventListeners();
    setupTools();

    // Check for drag & drop
    const dropZone = document.querySelector('.workspace');
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.background = '#f0f9ff';
    });
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.background = '';
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.background = '';
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // Check URL params for debug
    // loadPdf('path/to/demo.pdf');
}

function setupEventListeners() {
    elements.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    elements.saveBtn.addEventListener('click', savePdf);
}

function setupTools() {
    const btns = elements.toolbar.querySelectorAll('.tool-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Deactivate all
            btns.forEach(b => b.classList.remove('active'));
            // Activate click
            btn.classList.add('active');

            const tool = btn.dataset.tool;
            switchTool(tool);
        });
    });
}

function switchTool(tool) {
    state.activeTool = tool;

    // Show/Hide Subtoolbar
    elements.subToolbar.style.display = 'none';
    Object.values(elements.toolOptions).forEach(el => el.style.display = 'none');

    if (tool === 'text') {
        elements.subToolbar.style.display = 'flex';
        elements.toolOptions.text.style.display = 'flex';
        document.body.style.cursor = 'text';
    } else if (tool === 'draw') {
        elements.subToolbar.style.display = 'flex';
        elements.toolOptions.draw.style.display = 'flex';
        document.body.style.cursor = 'crosshair';
        startDrawingMode();
    } else if (tool === 'sign') {
        document.getElementById('signatureModal').style.display = 'flex';
        // But keep active tool as cursor until signature is ready to place
        switchTool('cursor');
    } else {
        document.body.style.cursor = 'default';
        stopDrawingMode();
    }
}

async function handleFile(file) {
    if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file.');
        return;
    }

    state.file = file;
    const arrayBuffer = await file.arrayBuffer();
    state.currentPdfBytes = arrayBuffer;

    // Switch UI
    elements.uploadContainer.style.display = 'none';
    elements.editorContainer.style.display = 'flex';
    elements.saveBtn.textContent = 'Apply changes & Download';

    loadPdf(arrayBuffer);
}

async function loadPdf(data) {
    try {
        const loadingTask = pdfjsLib.getDocument(data);
        state.pdfDoc = await loadingTask.promise;
        state.totalPages = state.pdfDoc.numPages;

        console.log('PDF Loaded', state.totalPages);
        renderAllPages();
    } catch (err) {
        console.error('Error loading PDF:', err);
        alert('Error parsing PDF. Is it valid?');
    }
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

    // Container
    const pageContainer = document.createElement('div');
    pageContainer.className = 'pdf-page-container';
    pageContainer.style.width = `${viewport.width}px`;
    pageContainer.style.height = `${viewport.height}px`;
    pageContainer.dataset.pageNumber = pageNum;

    // Canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    pageContainer.appendChild(canvas);
    elements.pdfViewer.appendChild(pageContainer);

    // Overlay Layer (for drawing/text)
    const overlay = document.createElement('div');
    overlay.className = 'page-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.zIndex = 1;
    pageContainer.appendChild(overlay);

    // Render PDF
    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };
    await page.render(renderContext).promise;

    // Track
    state.pages.push({
        num: pageNum,
        container: pageContainer,
        overlay: overlay,
        viewport: viewport
    });

    // Add interactions
    overlay.addEventListener('click', (e) => handlePageClick(e, pageNum, overlay));
}

function handlePageClick(e, pageNum, overlay) {
    if (state.activeTool === 'text') {
        addTextAnnotation(e.offsetX, e.offsetY, overlay, pageNum);
    }
}

function addTextAnnotation(x, y, overlay, pageNum) {
    const textDiv = document.createElement('div');
    textDiv.contentEditable = true;
    textDiv.className = 'text-overlay';
    textDiv.style.left = `${x}px`;
    textDiv.style.top = `${y}px`;
    textDiv.style.fontSize = `${document.getElementById('fontSize').value}px`;
    textDiv.style.color = document.getElementById('fontColor').value;
    textDiv.style.fontFamily = document.getElementById('fontFamily').value;

    textDiv.textContent = 'Type here...';

    // Focus and select all
    overlay.appendChild(textDiv);
    textDiv.focus();

    // Drag/Move logic to be added

    // Save annotation to state
    state.annotations.push({
        type: 'text',
        page: pageNum,
        x: x,
        y: y,
        ref: textDiv
    });
}

function startDrawingMode() {
    // Add canvas layer to all pages for drawing
    // Complex - requires tracking paths
}

function stopDrawingMode() {

}

// --- Signature Logic ---
const canvas = document.getElementById("signaturePad");
if (canvas) {
    const ctx = canvas.getContext("2d");
    let drawing = false;

    canvas.addEventListener("mousedown", (e) => {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    });
    canvas.addEventListener("mousemove", (e) => {
        if (!drawing) return;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    });
    canvas.addEventListener("mouseup", () => drawing = false);

    window.clearSignature = () => ctx.clearRect(0, 0, 400, 200);
    window.saveSignature = () => {
        // Convert to image and switch to Place Image mode
        const dataUrl = canvas.toDataURL();
        switchTool('image', dataUrl); // We'd need to handle this internal image
        document.getElementById('signatureModal').style.display = 'none';
        alert("Signature saved! Click on document to place.");
    };
    window.toggleSignatureModal = (show) => {
        document.getElementById('signatureModal').style.display = show ? 'flex' : 'none';
    };
}


// --- Export Logic ---
async function savePdf() {
    const { PDFDocument, rgb, StandardFonts } = PDFLib;

    // Determine which PDF to modify (original vs already modified)
    // For now, reload from original bytes to be safe
    const pdfDoc = await PDFDocument.load(state.currentPdfBytes);

    // Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();

    // Process Annotations
    for (const ann of state.annotations) {
        if (ann.type === 'text') {
            const page = pages[ann.page - 1]; // 0-indexed
            const { width, height } = page.getSize();

            // Convert viewport coordinates to PDF coordinates
            // PDF coords: Y starts from bottom
            // HTML coords: Y starts from top
            // Need to account for scale

            const viewport = state.pages[ann.page - 1].viewport;
            const pdfX = (ann.ref.offsetLeft / state.scale);
            const pdfY = height - (ann.ref.offsetTop / state.scale) - (parseInt(ann.ref.style.fontSize) / state.scale);
            // NOTE: Font size alignment in PDFLib is baseline-based, HTML is top-based. Approximate.

            page.drawText(ann.ref.innerText, {
                x: pdfX,
                y: pdfY,
                size: parseInt(ann.ref.style.fontSize),
                font: helveticaFont,
                color: rgb(0, 0, 0), // convert hex to rgb later
            });
        }
    }

    const pdfBytes = await pdfDoc.save();
    download(pdfBytes, "edited_document.pdf", "application/pdf");
}

// Start
init();
