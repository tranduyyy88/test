document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("file-input");
  const imagesContainer = document.getElementById("images-container");
  const lightbox = document.getElementById("lightbox");
  const closeButton = document.querySelector(".close-modal");
  const prevButton = document.querySelector(".prev-button");
  const nextButton = document.querySelector(".next-button");
  const API = "https://664c9b3835bbda1098811956.mockapi.io/Image";

  var images = [];

  async function getImages() {
    try {
      const response = await fetch(API, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      images = await response.json();
      renderImages();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function deleteImages(id) {
    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function postImages(data) {
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log("Success:", result);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  getImages();

  const renderImages = () => {
    imagesContainer.innerHTML = "";
    images.forEach((image, index) => {
      const imageWrapper = document.createElement("div");
      imageWrapper.className = "image-wrapper";
      imageWrapper.draggable = true;
      imageWrapper.dataset.index = index;

      imageWrapper.addEventListener("dragstart", handleDragStart);
      imageWrapper.addEventListener("dragover", handleDragOver);
      imageWrapper.addEventListener("drop", handleDrop);
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
          [images[index], images[index - 1]] = [
            images[index - 1],
            images[index],
          ];
          renderImages();
        };
        actionButton.appendChild(leftButton);
      }

      if (index < images.length - 1) {
        const rightButton = document.createElement("button");
        rightButton.className = "swap-button swap-button--right";
        rightButton.innerHTML = `<i class='bx bxs-right-arrow-alt'></i> Swap Image to right`;
        rightButton.onclick = () => {
          [images[index], images[index + 1]] = [
            images[index + 1],
            images[index],
          ];
          renderImages();
        };
        actionButton.appendChild(rightButton);
      }
      actionButton.appendChild(deleteButton);
      imagesContainer.appendChild(imageWrapper);
    });
  };

  const handleDragStart = (event) => {
    event.target.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", event.target.dataset.index);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const draggedIndex = event.dataTransfer.getData("text/plain");
    const targetWrapper = event.target.closest(".image-wrapper");
    const targetIndex = targetWrapper ? targetWrapper.dataset.index : -1;

    if (targetIndex !== -1 && draggedIndex !== targetIndex) {
      const draggedImage = images[draggedIndex];
      images.splice(draggedIndex, 1);
      images.splice(targetIndex, 0, draggedImage);
      renderImages();
    }
  };

  const handleDragEnd = (event) => {
    event.target.classList.remove("dragging");
  };

  const handleLightbox = (event) => {
    if (!event.target.closest("button")) {
      const targetIndex = event.target.dataset.index;
      lightbox.dataset.index = targetIndex;
      const image = images[targetIndex].url;
      lightbox.classList.add("active");
      const img = document.createElement("img");
      img.src = image;
      lightbox.querySelector(".modal-content").appendChild(img);
    }
  };

  fileInput.addEventListener("change", (event) => {
    const newImages = Array.from(event.target.files).map((file) => {
      return {
        id: Math.floor(Math.random() * 100),
        url: URL.createObjectURL(file),
      };
    });
    images.push(...newImages);
    newImages.map((image) => {
      postImages(image);
    });
    renderImages();
  });

  closeButton.addEventListener("click", (event) => {
    event.preventDefault();
    lightbox.classList.remove("active");
    lightbox.querySelector(".modal-content").innerHTML = "";
  });

  function loadImage(index) {
    const image = images[index].url;
    lightbox.querySelector(".modal-content img").setAttribute("src", image);
    lightbox.setAttribute("data-index", index);
  }
  prevButton.addEventListener("click", (event) => {
    event.preventDefault();
    var index = lightbox.dataset.index;
    if (index == 0) {
      index = images.length - 1;
    } else {
      index = --targetIndex;
    }
    loadImage(index);
  });

  nextButton.addEventListener("click", (event) => {
    event.preventDefault();
    var index = lightbox.dataset.index;
    if (index == images.length - 1) {
      index = 0;
    } else {
      index = ++index;
    }
    loadImage(index);
  });
});
