import interact from "interactjs";

export function makeInteractive(el, options = {}) {
  const { drag = true, resize = true, rotate = true, callbacks = {} } = options;

  // Draggable
  if (drag) {
    interact(el).draggable({
      listeners: {
        move(event) {
          const x = (parseFloat(el.getAttribute("data-x")) || 0) + event.dx;
          const y = (parseFloat(el.getAttribute("data-y")) || 0) + event.dy;
          const angle = parseFloat(el.dataset.rotate || 0);
          console.log("darg");
          el.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
          el.setAttribute("data-x", x);
          el.setAttribute("data-y", y);

          callbacks.onMove?.({ x, y });

          // Example: delete if dragged out of certain bounds
          if (x > 500 || y > 500) {
            event.target.remove();
          }
        },
      },
    });
  }

  // Resizable
  if (resize) {
    interact(el).resizable({
      edges: { left: true, right: true, bottom: true, top: true },
      listeners: {
        move(event) {
          const width = event.rect.width;
          const height = event.rect.height;
          el.style.width = width + "px";
          el.style.height = height + "px";

          const x = parseFloat(el.getAttribute("data-x")) || 0;
          const y = parseFloat(el.getAttribute("data-y")) || 0;
          console.log("resize");
          const angle = parseFloat(el.dataset.rotate || 0);
          el.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;

          callbacks.onResize?.({ width, height });
        },
      },
    });
  }

  // Rotate with wheel
  if (rotate) {
    el.addEventListener("wheel", (e) => {
      e.preventDefault();
      let angle = parseFloat(el.dataset.rotate || 0);
      angle += e.deltaY * 0.1; // adjust rotation speed
      el.dataset.rotate = angle;

      const x = parseFloat(el.getAttribute("data-x")) || 0;
      const y = parseFloat(el.getAttribute("data-y")) || 0;
      el.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;

      callbacks.onRotate?.({ angle });
    });
  }
}

export function addElement(target, content, options = {}) {
  const el = document.createElement("div");
  el.innerHTML = content;
  el.style.position = "absolute";
  el.style.left = options.left || "50px";
  el.style.top = options.top || "50px";
  el.style.zIndex = options.zIndex || 11;
  el.style.fontSize = options.fontSize || "48px";
  if (options.className) el.className = options.className;
  el.setAttribute("data-x", 0);
  el.setAttribute("data-y", 0);
  el.dataset.rotate = 0;

  target.appendChild(el);

  if (options.makeInteractive) {
    makeInteractive(el, options.interactOptions || {});
  }

  return el;
}
