const { JSDOM } = require("jsdom");

const handleDragStart = jest.fn();
const handleDragOver = jest.fn();
const handleDrop = jest.fn();
const handleDragEnd = jest.fn();
const deleteImages = jest.fn();

let images = [
  { id: 1, url: "https://httpbin.org/image/png" },
  { id: 2, url: "https://httpbin.org/image/jpeg" },
];

let dom;
let imagesContainer;
let lightbox;

const handleLightbox = (event) => {
  if (!event.target.closest("button")) {
    const targetIndex = event.target.dataset.index;
    lightbox.dataset.index = targetIndex;
    const image = images[targetIndex].url;
    lightbox.classList.add("active");
    const modalContent = lightbox.querySelector(".modal-content");
    modalContent.innerHTML = "";
    const img = document.createElement("img");
    img.src = image;
    modalContent.appendChild(img);
  }
};

const renderImages = () => {
  imagesContainer.innerHTML = "";
  images.forEach((image, index) => {
    const imageWrapper = document.createElement("div");
    imageWrapper.className = "image-wrapper";
    imageWrapper.draggable = true;
    imageWrapper.dataset.index = index;

    imageWrapper.addEventListener("dragstart", (event) => {
      event.dataTransfer = {
        setData: jest.fn(),
        getData: jest.fn(() => index),
      };
      event.dataTransfer.setData("text/plain", index);
      handleDragStart(event);
    });
    imageWrapper.addEventListener("dragover", (event) => {
      event.preventDefault(); // Necessary to allow drop
      handleDragOver(event);
    });
    imageWrapper.addEventListener("drop", (event) => {
      event.preventDefault();
      const draggedIndex = event.dataTransfer.getData("text/plain");
      const targetIndex = event.currentTarget.dataset.index;
      [images[draggedIndex], images[targetIndex]] = [
        images[targetIndex],
        images[draggedIndex],
      ];
      renderImages();
      handleDrop(event);
    });
    imageWrapper.addEventListener("dragend", handleDragEnd);
    imageWrapper.addEventListener("click", handleLightbox);

    const img = document.createElement("img");
    img.src = image.url;
    img.dataset.index = index;
    imageWrapper.appendChild(img);

    const actionButton = document.createElement("div");
    actionButton.className = "action-button";
    imageWrapper.appendChild(actionButton);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.innerHTML = `<i class='bx bxs-trash icon'></i> Delete Image`;
    deleteButton.onclick = () => {
      deleteImages(images[index].id);
      images = images.filter((_, i) => i !== index);
      renderImages();
    };

    if (index > 0) {
      const leftButton = document.createElement("button");
      leftButton.className = "swap-button swap-button--left";
      leftButton.innerHTML = `<i class='bx bxs-left-arrow-alt'></i> Swap Image to left`;
      leftButton.onclick = () => {
        [images[index], images[index - 1]] = [images[index - 1], images[index]];
        renderImages();
      };
      actionButton.appendChild(leftButton);
    }

    if (index < images.length - 1) {
      const rightButton = document.createElement("button");
      rightButton.className = "swap-button swap-button--right";
      rightButton.innerHTML = `<i class='bx bxs-right-arrow-alt'></i> Swap Image to right`;
      rightButton.onclick = () => {
        [images[index], images[index + 1]] = [images[index + 1], images[index]];
        renderImages();
      };
      actionButton.appendChild(rightButton);
    }
    actionButton.appendChild(deleteButton);
    imagesContainer.appendChild(imageWrapper);
  });
};

describe("renderImages", () => {
  beforeEach(() => {
    // Setup DOM
    dom =
      new JSDOM(`<div id="imagesContainer"></div><div id="lightbox" class="modal">
            <button class="close-modal"><i class='bx bxs-x-circle'></i></button>
            <div class="modal-content">

            </div>
            <button class="prev-button button"><i class='bx bx-chevron-left'></i></button>
            <button class="next-button button"><i class='bx bx-chevron-right'></i></button>
        </div>`);
    global.document = dom.window.document;
    global.window = dom.window;

    imagesContainer = document.getElementById("imagesContainer");
    lightbox = document.getElementById("lightbox");
  });

  it("should render images correctly", () => {
    renderImages();

    const wrappers = imagesContainer.querySelectorAll(".image-wrapper");
    expect(wrappers.length).toBe(2);
    expect(wrappers[0].querySelector("img").src).toBe(
      "https://httpbin.org/image/png"
    );
    expect(wrappers[1].querySelector("img").src).toBe(
      "https://httpbin.org/image/jpeg"
    );
  });

  it("should handle swap left buttons click", () => {
    renderImages();

    const imageWrappers = imagesContainer.querySelectorAll(".image-wrapper");
    expect(imageWrappers.length).toBe(2);

    const leftButton = imageWrappers[1].querySelector(".swap-button--left");
    leftButton.click();

    expect(images[0].id).toBe(2);
    expect(images[1].id).toBe(1);
  });

  it("should handle swap right buttons click", () => {
    renderImages();

    const imageWrappers = imagesContainer.querySelectorAll(".image-wrapper");
    expect(imageWrappers.length).toBe(2);

    const rightButton = imageWrappers[0].querySelector(".swap-button--right");
    rightButton.click();

    expect(images[0].id).toBe(1);
    expect(images[1].id).toBe(2);
  });

  it("should handle drop event correctly", () => {
    renderImages();

    const imageWrappers = imagesContainer.querySelectorAll(".image-wrapper");
    expect(imageWrappers.length).toBe(2);

    const draggedElement = imageWrappers[0];
    const dropTarget = imageWrappers[1];

    // Mock the DataTransfer object
    const dataTransfer = {
      data: {},
      setData(key, value) {
        this.data[key] = value;
      },
      getData(key) {
        return this.data[key];
      },
    };

    const dragStartEvent = new dom.window.CustomEvent("dragstart", {
      detail: { dataTransfer },
    });
    draggedElement.dispatchEvent(dragStartEvent);

    const dropEvent = new dom.window.CustomEvent("drop", {
      detail: { dataTransfer },
    });
    dropTarget.dispatchEvent(dropEvent);

    expect(images[0].id).toBe(1);
    expect(images[1].id).toBe(2);
  });

  it("should handle lightbox click correctly", () => {
    renderImages();

    const imageWrappers = imagesContainer.querySelectorAll(".image-wrapper");
    const img = imageWrappers[0].querySelector("img");

    const clickEvent = new dom.window.MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: dom.window,
    });
    img.dispatchEvent(clickEvent);

    expect(lightbox.classList.contains("active")).toBe(true);
    const lightboxImage = lightbox.querySelector(".modal-content img");
    expect(lightboxImage).not.toBeNull();
    expect(lightboxImage.src).toBe("https://httpbin.org/image/png");
  });

  it("should handle delete button click", () => {
    renderImages();
    const deleteButtons = imagesContainer.querySelectorAll(".delete-button");
    deleteButtons[0].click();

    expect(deleteImages).toHaveBeenCalledWith(1);
    expect(images.length).toBe(1);
  });
});
