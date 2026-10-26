(() => {
  const carousel = document.querySelector('.slideshow');
  const track = document.querySelector('.slide-track');
  if (!carousel || !track) return;

  const links = [...track.querySelectorAll('.slide-image-link')];
  const previous = carousel.querySelector('[data-prev]');
  const next = carousel.querySelector('[data-next]');
  const counter = carousel.querySelector('[data-counter]');
  const viewer = document.querySelector('.slide-viewer');
  const viewerImage = viewer.querySelector('.viewer-image');
  const viewerPrevious = viewer.querySelector('[data-viewer-prev]');
  const viewerNext = viewer.querySelector('[data-viewer-next]');
  const viewerCounter = viewer.querySelector('[data-viewer-counter]');
  const original = viewer.querySelector('[data-original]');
  let current = 0;
  let expanded = 0;
  let scrollFrame;
  let opener;

  const clamp = (index) => Math.max(0, Math.min(links.length - 1, index));
  const label = (index) => `${String(index + 1).padStart(2, '0')} / ${links.length}`;
  function updateControls(index, prevButton, nextButton, count) {
    count.textContent = label(index);
    prevButton.setAttribute('aria-disabled', String(index === 0));
    nextButton.setAttribute('aria-disabled', String(index === links.length - 1));
  }
  function syncPosition() {
    if (!track.clientWidth) return;
    const index = clamp(Math.round(track.scrollLeft / track.clientWidth));
    if (current !== index) {
      current = index;
      updateControls(current, previous, next, counter);
    }
  }
  function goTo(index) {
    current = clamp(index);
    track.scrollTo({
      left: current * track.clientWidth,
      behavior: 'instant',
    });
    updateControls(current, previous, next, counter);
  }
  function showExpanded(index) {
    expanded = clamp(index);
    const image = links[expanded].querySelector('img');
    viewerImage.src = links[expanded].href;
    viewerImage.alt = image.alt;
    original.href = links[expanded].href;
    updateControls(expanded, viewerPrevious, viewerNext, viewerCounter);
  }
  function openViewer(index, trigger) {
    if (typeof viewer.showModal !== 'function') {
      window.location.href = links[index].href;
      return;
    }
    opener = trigger;
    showExpanded(index);
    document.documentElement.classList.add('viewer-open');
    viewer.showModal();
  }
  function handleKeys(event, index, navigate) {
    const destinations = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: links.length - 1 };
    if (!(event.key in destinations) || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    navigate(destinations[event.key]);
  }

  previous.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  carousel.addEventListener('keydown', (event) => handleKeys(event, current, goTo));
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(syncPosition);
  }, { passive: true });
  // Keep the same slide after rotating a phone or resizing the window.
  new ResizeObserver(() => goTo(current)).observe(track);
  links.forEach((link, index) => {
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openViewer(index, link);
    });
  });
  carousel.querySelector('[data-expand]').addEventListener('click', (event) => openViewer(current, event.currentTarget));
  viewerPrevious.addEventListener('click', () => showExpanded(expanded - 1));
  viewerNext.addEventListener('click', () => showExpanded(expanded + 1));
  viewer.addEventListener('keydown', (event) => handleKeys(event, expanded, showExpanded));
  viewer.querySelector('[data-close]').addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => {
    document.documentElement.classList.remove('viewer-open');
    goTo(expanded);
    // Restore focus to the corresponding visible image when the viewer changed slides.
    const target = opener?.classList.contains('slide-image-link') ? links[expanded] : opener;
    target?.focus({ preventScroll: true });
  });
  carousel.querySelector('.slide-controls').hidden = false;
  updateControls(current, previous, next, counter);
})();
