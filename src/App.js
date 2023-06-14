import axios from "axios";
import React, { useRef, useState, useEffect } from "react";
import Moveable from "react-moveable";

const App = () => {
  const [moveableComponents, setMoveableComponents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [randomImages, setRandomImages] = useState([]);
  const [selectedRandomImages, setSelectedRandomImages] = useState([]);

  useEffect(() => {
    axios
      .get("https://jsonplaceholder.typicode.com/photos")
      .then((res) => {
        setRandomImages(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const addUniqueImage = () => {
    const randomImageIndex = Math.floor(Math.random() * randomImages.length);
    const newRandomImagesArray = [...randomImages];
    newRandomImagesArray.splice(randomImageIndex, 1);
    setSelectedRandomImages((selectedRandomImages) => [
      ...selectedRandomImages,
      randomImages[randomImageIndex],
    ]);
    setRandomImages(newRandomImagesArray);
  };

  const addMoveable = () => {
    // Create a new moveable component and add it to the array
    const objectFitValues = ["fill", "contain", "cover", "none", "scale-down"];
    addUniqueImage();

    setMoveableComponents([
      ...moveableComponents,
      {
        id: Math.floor(Math.random() * Date.now()),
        top: 0,
        left: 0,
        width: 100,
        height: 100,
        objectFit:
          objectFitValues[Math.floor(Math.random() * objectFitValues.length)],
        updateEnd: true,
      },
    ]);
  };

  const updateMoveable = (id, newComponent, updateEnd = false) => {
    const updatedMoveables = moveableComponents.map((moveable, i) => {
      if (moveable.id === id) {
        return { id, ...newComponent, updateEnd };
      }
      return moveable;
    });
    setMoveableComponents(updatedMoveables);
  };

  const removeMoveable = () => {
    const newArray = moveableComponents.filter(
      (component) => component.id !== selected
    );
    setMoveableComponents(newArray);
    setSelected(null);
  };

  const handleResizeStart = (index, e) => {
    console.log("e", e.direction);
    // Check if the resize is coming from the left handle
    const [handlePosX, handlePosY] = e.direction;
    // 0 => center
    // -1 => top or left
    // 1 => bottom or right

    // -1, -1
    // -1, 0
    // -1, 1
    if (handlePosX === -1) {
      console.log("width", moveableComponents, e);
      // Save the initial left and width values of the moveable component
      const initialLeft = e.left;
      const initialWidth = e.width;

      // Set up the onResize event handler to update the left value based on the change in width
    }
  };

  const containerRef = useRef();

  return (
    <main style={{ height: "100vh", width: "100vw" }}>
      <button onClick={addMoveable}>Add Moveable1</button>
      <>
        {selected ? (
          <button onClick={removeMoveable}>Remove selected moveable</button>
        ) : (
          ""
        )}
      </>
      <div
        ref={containerRef}
        id="parent"
        style={{
          position: "relative",
          background: "black",
          height: "80vh",
          width: "80vw",
        }}
      >
        {moveableComponents.map((item, index) => (
          <Component
            {...item}
            key={index}
            updateMoveable={updateMoveable}
            handleResizeStart={handleResizeStart}
            setSelected={setSelected}
            isSelected={selected === item.id}
            image={selectedRandomImages[index]}
            containerRef={containerRef}
          />
        ))}
      </div>
    </main>
  );
};

export default App;

const Component = ({
  updateMoveable,
  top,
  left,
  width,
  height,
  index,
  id,
  objectFit,
  setSelected,
  isSelected = false,
  updateEnd,
  containerRef,
  image,
}) => {
  const ref = useRef();

  const [nodoReferencia, setNodoReferencia] = useState({
    top,
    left,
    width,
    height,
    index,
    id,
    objectFit,
  });

  let parent = document.getElementById("parent");
  let parentBounds = parent?.getBoundingClientRect();

  const onResize = async (e) => {
    // ACTUALIZAR ALTO Y ANCHO
    let newWidth = e.width;
    let newHeight = e.height;

    const positionMaxTop = top + newHeight;
    const positionMaxLeft = left + newWidth;

    if (positionMaxTop > parentBounds?.height)
      newHeight = parentBounds?.height - top;
    if (positionMaxLeft > parentBounds?.width)
      newWidth = parentBounds?.width - left;

    updateMoveable(id, {
      top,
      left,
      width: newWidth,
      height: newHeight,
      objectFit,
    });

    // ACTUALIZAR NODO REFERENCIA
    const beforeTranslate = e.drag.beforeTranslate;

    ref.current.style.width = `${e.width}px`;
    ref.current.style.height = `${e.height}px`;

    let translateX = beforeTranslate[0];
    let translateY = beforeTranslate[1];

    ref.current.style.transform = `translate(${translateX}px, ${translateY}px)`;

    setNodoReferencia({
      ...nodoReferencia,
      translateX,
      translateY,
      top: top + translateY < 0 ? 0 : top + translateY,
      left: left + translateX < 0 ? 0 : left + translateX,
    });
  };

  const onResizeEnd = async (e) => {
    let newWidth = e.lastEvent?.width;
    let newHeight = e.lastEvent?.height;

    const positionMaxTop = top + newHeight;
    const positionMaxLeft = left + newWidth;

    if (positionMaxTop > parentBounds?.height)
      newHeight = parentBounds?.height - top;
    if (positionMaxLeft > parentBounds?.width)
      newWidth = parentBounds?.width - left;

    const { lastEvent } = e;
    const { drag } = lastEvent;
    const { beforeTranslate } = drag;

    const absoluteTop = top + beforeTranslate[1];
    const absoluteLeft = left + beforeTranslate[0];

    updateMoveable(
      id,
      {
        top,
        left,
        width: newWidth,
        height: newHeight,
        objectFit,
      },
      true
    );
  };

  const onDrag = async (e) => {
    const containerRect = containerRef.current.getBoundingClientRect();
    const targetRect = e.target.getBoundingClientRect();
    const overflowX = containerRect.width - targetRect.width;
    const overflowY = containerRect.height - targetRect.height;

    if (e.left < containerRect.left) {
      e.left = 0;
    } else if (e.left > containerRect.left + overflowX) {
      e.left = containerRect.width - targetRect.width;
    }
    if (e.top < containerRect.top) {
      e.top = 0;
    } else if (e.top > containerRect.top + overflowY) {
      e.top = containerRect.height - targetRect.height;
    }

    updateMoveable(id, {
      top: e.top,
      left: e.left,
      width,
      height,
      objectFit,
    });
  };

  return (
    <>
      <img
        ref={ref}
        src={image.url}
        alt="Imágen aleatoria"
        className="draggable"
        id={"component-" + id}
        style={{
          position: "absolute",
          top: top,
          left: left,
          width: width,
          height: height,
          objectFit: objectFit,
        }}
        onClick={() => setSelected(id)}
      />
      <Moveable
        target={isSelected && ref.current}
        resizable
        draggable
        onDrag={onDrag}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
        keepRatio={false}
        throttleResize={1}
        renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
        edge={false}
        zoom={1}
        origin={false}
        padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
      />
    </>
  );
};
