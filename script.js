document.addEventListener('DOMContentLoaded', () => {

  /* =========================================================
     DOM ELEMENTS
  ========================================================= */

  const animListContainer = document.getElementById('animation-list');
  const slideCanvas = document.getElementById('slide-canvas');

  const addSlideBtn = document.getElementById('add-slide-btn');
  const slidesList = document.getElementById('slides-list');

  const addTextBtn = document.getElementById('add-text-btn');
  const addShapeBtn = document.getElementById('add-shape-btn');

  const clearCanvasBtn = document.getElementById('clear-canvas-btn');
  const playPresentationBtn = document.getElementById('play-presentation-btn');

  const animDurationInput = document.getElementById('anim-duration');
  const animDelayInput = document.getElementById('anim-delay');

  // COLOR PICKER & FONT SELECTOR DOM
  const colorPicker = document.getElementById('element-color-picker');
  const fontSelect = document.getElementById('font-family-select');


  /* =========================================================
     HTML ANIMATION MODAL
  ========================================================= */

  const addHtmlAnimBtn = document.getElementById('add-html-anim-btn');
  const embedModal = document.getElementById('embed-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const insertHtmlBtn = document.getElementById('insert-html-btn');
  const htmlCodeInput = document.getElementById('html-code-input');


  /* =========================================================
     SHAPE PICKER MODAL
  ========================================================= */

  const shapeModal = document.getElementById('shape-modal');
  const openShapePickerBtn = document.getElementById('open-shape-picker-btn');
  const closeShapeModalBtn = document.getElementById('close-shape-modal-btn');


  /* =========================================================
     EDITOR MENU
  ========================================================= */

  const toolsPanel = document.getElementById('tools-panel');
  const menuBackdrop = document.getElementById('menu-backdrop');

  const toolsMenuBtn = document.getElementById('tools-menu-btn');
  const toolsMenuBtnBottom = document.getElementById('tools-menu-btn-bottom');
  const closeToolsBtn = document.getElementById('close-tools-btn');
  const effectsMenuBtn = document.getElementById('effects-menu-btn');
  const motionMenuBtn = document.getElementById('motion-menu-btn');


  /* =========================================================
     UNDO / REDO & DELETE
  ========================================================= */

  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  const deleteSelectedBtn = document.getElementById('delete-selected-btn');


  /* =========================================================
     STATE VARIABLES
  ========================================================= */

  let slides = [{ id: 1, content: '' }];
  let activeSlideId = 1;
  let selectedElement = null;
  let history = [];
  let historyIndex = -1;


  /* =========================================================
     TOOLS PANEL LOGIC
  ========================================================= */

  function openTools(tabName = 'add') {
    if (toolsPanel) toolsPanel.classList.add('active');
    if (menuBackdrop) menuBackdrop.classList.add('active');

    document.querySelectorAll('.tool-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.tab === tabName) tab.classList.add('active');
    });

    document.querySelectorAll('.tool-content').forEach(content => {
      content.classList.remove('active');
    });

    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) targetTab.classList.add('active');
  }

  function closeTools() {
    if (toolsPanel) toolsPanel.classList.remove('active');
    if (menuBackdrop) menuBackdrop.classList.remove('active');
  }

  if (toolsMenuBtn) toolsMenuBtn.addEventListener('click', () => openTools('add'));
  if (toolsMenuBtnBottom) toolsMenuBtnBottom.addEventListener('click', () => openTools('add'));
  if (effectsMenuBtn) effectsMenuBtn.addEventListener('click', () => openTools('effects'));
  if (motionMenuBtn) motionMenuBtn.addEventListener('click', () => openTools('motion'));
  if (closeToolsBtn) closeToolsBtn.addEventListener('click', closeTools);
  if (menuBackdrop) menuBackdrop.addEventListener('click', closeTools);

  document.querySelectorAll('.tool-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      document.querySelectorAll('.tool-tab').forEach(item => item.classList.remove('active'));
      document.querySelectorAll('.tool-content').forEach(content => content.classList.remove('active'));
      tab.classList.add('active');

      const targetContent = document.getElementById(`tab-${tabName}`);
      if (targetContent) targetContent.classList.add('active');
    });
  });


  /* =========================================================
     FETCH & RENDER ANIMATIONS
  ========================================================= */

  fetch('animations.json')
    .then(res => {
      if (!res.ok) throw new Error(`Could not load animations.json (${res.status})`);
      return res.json();
    })
    .then(data => {
      const animations = data.sidebarAnimations || data;
      if (Array.isArray(animations)) renderSidebar(animations);
    })
    .catch(err => console.error('Error loading animations.json:', err));

  function renderSidebar(animations) {
    if (!animListContainer) return;
    animListContainer.innerHTML = '';

    animations.forEach(anim => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'anim-card';
      card.innerHTML = `
        <span>${anim.preview || '🎬'}</span>
        <strong>${anim.title || 'Untitled Animation'}</strong>
      `;

      card.addEventListener('click', () => {
        if (!anim.source) return;
        createHtmlAnimationElement({ sourceUrl: anim.source });
      });

      animListContainer.appendChild(card);
    });
  }


  /* =========================================================
     HTML ANIMATION MODAL LOGIC
  ========================================================= */

  if (addHtmlAnimBtn) {
    addHtmlAnimBtn.addEventListener('click', () => {
      if (embedModal) embedModal.style.display = 'flex';
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      if (embedModal) embedModal.style.display = 'none';
      if (htmlCodeInput) htmlCodeInput.value = '';
    });
  }

  if (insertHtmlBtn) {
    insertHtmlBtn.addEventListener('click', () => {
      if (!htmlCodeInput) return;
      const code = htmlCodeInput.value.trim();
      if (!code) return;

      createHtmlAnimationElement({ rawCode: code });
      if (embedModal) embedModal.style.display = 'none';
      htmlCodeInput.value = '';
    });
  }

  function createHtmlAnimationElement({ rawCode, sourceUrl }) {
    removePlaceholder();

    const container = document.createElement('div');
    container.className = 'canvas-element html-anim-element';
    container.style.width = '400px';
    container.style.height = '250px';

    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.pointerEvents = 'none';

    if (rawCode) {
      iframe.srcdoc = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            html, body { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; }
          </style>
        </head>
        <body>${rawCode}</body>
        </html>
      `;
    } else if (sourceUrl) {
      iframe.src = sourceUrl;
    }

    container.appendChild(iframe);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    container.appendChild(resizeHandle);

    setupElement(container);
    makeResizable(container, resizeHandle);
    saveHistory();
  }


  /* =========================================================
     SHAPE PICKER MODAL CONTROL & CREATION
  ========================================================= */

  function openShapePicker() {
    if (shapeModal) shapeModal.style.display = 'flex';
  }

  function closeShapePicker() {
    if (shapeModal) shapeModal.style.display = 'none';
  }

  if (addShapeBtn) addShapeBtn.addEventListener('click', openShapePicker);
  if (openShapePickerBtn) openShapePickerBtn.addEventListener('click', openShapePicker);
  if (closeShapeModalBtn) closeShapeModalBtn.addEventListener('click', closeShapePicker);

  document.querySelectorAll('.shape-option').forEach(button => {
    button.addEventListener('click', () => {
      const shapeType = button.dataset.shape;
      createShape(shapeType);
      closeShapePicker();
    });
  });

  function createShape(shapeType) {
    removePlaceholder();

    const shapeEl = document.createElement('div');
    shapeEl.className = `canvas-element shape-element shape-${shapeType}`;
    shapeEl.dataset.shape = shapeType;
    shapeEl.style.width = '120px';
    shapeEl.style.height = '120px';

    const symbolShapes = {
      'star': '★',
      'star4': '✦',
      'heart': '♥',
      'cloud': '☁',
      'sun': '☀',
      'arrow-right': '→',
      'arrow-left': '←',
      'arrow-up': '↑',
      'arrow-down': '↓',
      'arrow-double': '↔',
      'chevron': '❯',
      'speech': '💬',
      'thought': '☁'
    };

    if (symbolShapes[shapeType]) {
      shapeEl.innerText = symbolShapes[shapeType];
      shapeEl.classList.add('symbol-shape');
      shapeEl.style.fontSize = '84px';
      shapeEl.style.lineHeight = '120px';
    }

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    shapeEl.appendChild(resizeHandle);

    setupElement(shapeEl);
    makeResizable(shapeEl, resizeHandle);
    saveHistory();
  }


  /* =========================================================
     SLIDE MANAGEMENT
  ========================================================= */

  if (addSlideBtn) {
    addSlideBtn.addEventListener('click', () => {
      saveCurrentSlideState();
      const newId = slides.length > 0 ? Math.max(...slides.map(s => s.id)) + 1 : 1;
      slides.push({ id: newId, content: '' });
      activeSlideId = newId;

      renderSlideThumbnails();
      slideCanvas.innerHTML = `<p class="placeholder">Tap + to add elements</p>`;
      deselectAll();
      saveHistory();
    });
  }

  function renderSlideThumbnails() {
    if (!slidesList) return;
    slidesList.innerHTML = '';

    slides.forEach((slide, index) => {
      const thumb = document.createElement('div');
      thumb.className = `slide-thumb ${slide.id === activeSlideId ? 'active' : ''}`;
      thumb.innerText = index + 1;

      thumb.addEventListener('click', () => {
        if (slide.id === activeSlideId) return;
        saveCurrentSlideState();
        switchSlide(slide.id);
      });

      slidesList.appendChild(thumb);
    });
  }

  function saveCurrentSlideState() {
    const currentSlide = slides.find(s => s.id === activeSlideId);
    if (currentSlide && slideCanvas) currentSlide.content = slideCanvas.innerHTML;
  }

  function switchSlide(id) {
    activeSlideId = id;
    const slide = slides.find(item => item.id === id);
    if (slideCanvas) slideCanvas.innerHTML = slide ? slide.content : '';

    renderSlideThumbnails();
    deselectAll();
    rebindCanvasElements();
  }


  /* =========================================================
     ADD TEXT
  ========================================================= */

  if (addTextBtn) {
    addTextBtn.addEventListener('click', () => {
      removePlaceholder();

      const textEl = document.createElement('div');
      textEl.className = 'canvas-element text-element';
      textEl.contentEditable = 'true';
      textEl.innerText = 'Editable Text';

      setupElement(textEl);
      saveHistory();
    });
  }


  /* =========================================================
     ELEMENT SETUP & SELECTION
  ========================================================= */

  function removePlaceholder() {
    if (!slideCanvas) return;
    const placeholder = slideCanvas.querySelector('.placeholder');
    if (placeholder) placeholder.remove();
  }

  function setupElement(el) {
    if (!el) return;
    el.style.top = '40%';
    el.style.left = '40%';

    el.addEventListener('click', elementClickHandler);
    makeDraggable(el);
    slideCanvas.appendChild(el);
    selectElement(el);
  }

  function elementClickHandler(e) {
    e.stopPropagation();
    selectElement(e.currentTarget);
  }

  function applyColorToElement(color) {
    if (!selectedElement) return;
    if (selectedElement.classList.contains('text-element') || selectedElement.classList.contains('symbol-shape')) {
      selectedElement.style.color = color;
    } else {
      selectedElement.style.backgroundColor = color;
    }
  }

  function selectElement(el) {
    if (!el) return;
    deselectAll();
    selectedElement = el;
    selectedElement.classList.add('selected');

    if (animDurationInput) {
      const duration = parseFloat(el.style.animationDuration);
      animDurationInput.value = Number.isFinite(duration) ? duration : 1;
    }

    if (animDelayInput) {
      const delay = parseFloat(el.style.animationDelay);
      animDelayInput.value = Number.isFinite(delay) ? delay : 0;
    }

    // Reflect current font style in dropdown
    if (fontSelect && el.style.fontFamily) {
      fontSelect.value = el.style.fontFamily;
    }

    // Reflect color in color picker
    if (colorPicker) {
      let currentColor = '';
      if (el.classList.contains('text-element') || el.classList.contains('symbol-shape')) {
        currentColor = el.style.color;
      } else {
        currentColor = el.style.backgroundColor;
      }
      if (currentColor) {
        colorPicker.value = rgbToHex(currentColor) || '#6c5ce7';
      }
    }
  }

  function deselectAll() {
    selectedElement = null;
    if (!slideCanvas) return;
    slideCanvas.querySelectorAll('.canvas-element, .anim-box').forEach(el => {
      el.classList.remove('selected');
    });
  }

  if (slideCanvas) {
    slideCanvas.addEventListener('click', deselectAll);
  }


  /* =========================================================
     COLOR PICKER & FONT CONTROLS LOGIC
  ========================================================= */

  if (colorPicker) {
    colorPicker.addEventListener('input', (e) => {
      if (!selectedElement) return;
      applyColorToElement(e.target.value);
      saveHistory();
    });
  }

  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!selectedElement) {
        alert('Select an element on the canvas first!');
        return;
      }
      const color = btn.dataset.color;
      if (colorPicker) colorPicker.value = color;
      applyColorToElement(color);
      saveHistory();
    });
  });

  if (fontSelect) {
    fontSelect.addEventListener('change', (e) => {
      if (!selectedElement) {
        alert('Select a text box or element first!');
        return;
      }
      selectedElement.style.fontFamily = e.target.value;
      saveHistory();
    });
  }

  // Utility Helper to convert RGB to Hex for color picker input
  function rgbToHex(rgbStr) {
    if (!rgbStr || !rgbStr.startsWith('rgb')) return rgbStr;
    const rgb = rgbStr.match(/\d+/g);
    if (!rgb || rgb.length < 3) return '#6c5ce7';
    return "#" + ((1 << 24) + (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2])).toString(16).slice(1);
  }


  /* =========================================================
     ANIMATION & CANVAS CONTROLS
  ========================================================= */

  if (animDurationInput) {
    animDurationInput.addEventListener('change', e => {
      if (!selectedElement) return;
      selectedElement.style.animationDuration = `${e.target.value}s`;
      saveHistory();
    });
  }

  if (animDelayInput) {
    animDelayInput.addEventListener('change', e => {
      if (!selectedElement) return;
      selectedElement.style.animationDelay = `${e.target.value}s`;
      saveHistory();
    });
  }

  if (clearCanvasBtn) {
    clearCanvasBtn.addEventListener('click', () => {
      if (!slideCanvas) return;
      slideCanvas.innerHTML = `<p class="placeholder">Tap + to add elements</p>`;
      selectedElement = null;
      saveHistory();
    });
  }

  if (playPresentationBtn) {
    playPresentationBtn.addEventListener('click', () => {
      deselectAll();
      const elements = slideCanvas.querySelectorAll('.canvas-element, .anim-box');

      elements.forEach(el => {
        const computedStyle = getComputedStyle(el);
        const animationName = computedStyle.animationName;
        if (!animationName || animationName === 'none') return;

        const duration = computedStyle.animationDuration;
        const timing = computedStyle.animationTimingFunction;
        const delay = computedStyle.animationDelay;
        const iteration = computedStyle.animationIterationCount;

        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = `${animationName} ${duration} ${timing} ${delay} ${iteration}`;
      });
    });
  }


  /* =========================================================
     REBIND ELEMENTS ON HISTORY / SLIDE SWITCH
  ========================================================= */

  function rebindCanvasElements() {
    if (!slideCanvas) return;
    const elements = slideCanvas.querySelectorAll('.canvas-element, .anim-box');

    elements.forEach(el => {
      delete el.dataset.draggable;
      el.addEventListener('click', elementClickHandler);
      makeDraggable(el);

      let handle = el.querySelector('.resize-handle');
      if (!handle) {
        handle = document.createElement('div');
        handle.className = 'resize-handle';
        el.appendChild(handle);
      }
      delete handle.dataset.resizable;
      makeResizable(el, handle);
    });
  }


  /* =========================================================
     DRAG LOGIC
  ========================================================= */

  function makeDraggable(el) {
    if (!el || el.dataset.draggable === 'true') return;
    el.dataset.draggable = 'true';

    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    const startDrag = e => {
      if (e.target.closest('.resize-handle')) return;
      if (e.target.isContentEditable && document.activeElement === e.target) return;

      const point = e.touches ? e.touches[0] : e;
      isDragging = true;
      startX = point.clientX;
      startY = point.clientY;
      initialLeft = el.offsetLeft;
      initialTop = el.offsetTop;
      el.style.zIndex = '1000';

      const doDrag = dragEvent => {
        if (!isDragging) return;
        dragEvent.preventDefault();
        const p = dragEvent.touches ? dragEvent.touches[0] : dragEvent;
        const dx = p.clientX - startX;
        const dy = p.clientY - startY;
        el.style.left = `${initialLeft + dx}px`;
        el.style.top = `${initialTop + dy}px`;
      };

      const stopDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        el.style.zIndex = '';
        window.removeEventListener('mousemove', doDrag);
        window.removeEventListener('touchmove', doDrag);
        window.removeEventListener('mouseup', stopDrag);
        window.removeEventListener('touchend', stopDrag);
        saveHistory();
      };

      window.addEventListener('mousemove', doDrag);
      window.addEventListener('touchmove', doDrag, { passive: false });
      window.addEventListener('mouseup', stopDrag);
      window.addEventListener('touchend', stopDrag);
    };

    el.addEventListener('touchstart', startDrag, { passive: false });
    el.addEventListener('mousedown', startDrag);
  }


  /* =========================================================
     RESIZE LOGIC
  ========================================================= */

  function makeResizable(el, handle) {
    if (!el || !handle || handle.dataset.resizable === 'true') return;
    handle.dataset.resizable = 'true';

    let isResizing = false;
    let startX = 0, startY = 0;
    let startWidth = 0, startHeight = 0;

    const startResize = e => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;

      const point = e.touches ? e.touches[0] : e;
      startX = point.clientX;
      startY = point.clientY;
      startWidth = el.offsetWidth;
      startHeight = el.offsetHeight;
      el.style.zIndex = '1001';

      const doResize = moveEvent => {
        if (!isResizing) return;
        moveEvent.preventDefault();
        const p = moveEvent.touches ? moveEvent.touches[0] : moveEvent;

        const newWidth = Math.max(30, startWidth + (p.clientX - startX));
        const newHeight = Math.max(30, startHeight + (p.clientY - startY));

        el.style.width = `${newWidth}px`;
        el.style.height = `${newHeight}px`;

        if (el.classList.contains('symbol-shape')) {
          const minDimension = Math.min(newWidth, newHeight);
          el.style.fontSize = `${minDimension * 0.7}px`;
          el.style.lineHeight = `${newHeight}px`;
        }
      };

      const stopResize = () => {
        if (!isResizing) return;
        isResizing = false;
        el.style.zIndex = '';

        window.removeEventListener('mousemove', doResize);
        window.removeEventListener('touchmove', doResize);
        window.removeEventListener('mouseup', stopResize);
        window.removeEventListener('touchend', stopResize);

        saveHistory();
      };

      window.addEventListener('mousemove', doResize);
      window.addEventListener('touchmove', doResize, { passive: false });
      window.addEventListener('mouseup', stopResize);
      window.addEventListener('touchend', stopResize);
    };

    handle.addEventListener('mousedown', startResize);
    handle.addEventListener('touchstart', startResize, { passive: false });
  }


  /* =========================================================
     EFFECTS & MOTION
  ========================================================= */

  document.querySelectorAll('[data-effect]').forEach(button => {
    button.addEventListener('click', () => {
      if (!selectedElement) {
        alert('Select an element first');
        return;
      }
      const effect = button.dataset.effect;
      selectedElement.classList.remove('effect-glow', 'effect-shadow', 'effect-glass', 'effect-neon', 'effect-3d');
      if (effect !== 'effect-remove') selectedElement.classList.add(effect);
      saveHistory();
    });
  });

  document.querySelectorAll('[data-motion]').forEach(button => {
    button.addEventListener('click', () => {
      if (!selectedElement) {
        alert('Select an element first');
        return;
      }
      const motion = button.dataset.motion;
      selectedElement.classList.remove('motion-float', 'motion-pulse', 'motion-shake', 'motion-spin', 'motion-bounce');
      selectedElement.classList.add(motion);
      saveHistory();
    });
  });

  if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener('click', () => {
      if (!selectedElement) {
        alert('Select an element first');
        return;
      }
      selectedElement.remove();
      selectedElement = null;
      saveHistory();
      closeTools();
    });
  }


  /* =========================================================
     UNDO / REDO HISTORY
  ========================================================= */

  function saveHistory() {
    saveCurrentSlideState();
    const snapshot = JSON.stringify({ slides, activeSlideId });

    if (historyIndex >= 0 && history[historyIndex] === snapshot) {
      updateUndoRedoButtons();
      return;
    }

    history = history.slice(0, historyIndex + 1);
    history.push(snapshot);
    if (history.length > 50) history.shift();
    historyIndex = history.length - 1;
    updateUndoRedoButtons();
  }

  function undo() {
    if (historyIndex <= 0) return;
    historyIndex--;
    restoreHistory();
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex++;
    restoreHistory();
  }

  function restoreHistory() {
    const state = JSON.parse(history[historyIndex]);
    slides = state.slides;
    activeSlideId = state.activeSlideId;

    const activeSlide = slides.find(slide => slide.id === activeSlideId);
    if (slideCanvas) slideCanvas.innerHTML = activeSlide ? activeSlide.content : '';

    renderSlideThumbnails();
    deselectAll();
    rebindCanvasElements();
    updateUndoRedoButtons();
  }

  function updateUndoRedoButtons() {
    if (undoBtn) undoBtn.disabled = historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = historyIndex >= history.length - 1;
  }

  if (undoBtn) undoBtn.addEventListener('click', undo);
  if (redoBtn) redoBtn.addEventListener('click', redo);


  /* =========================================================
     INITIAL SETUP
  ========================================================= */

  renderSlideThumbnails();
  saveHistory();

});
