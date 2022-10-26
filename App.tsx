import * as React from 'react';
import './style.css';

import { useState, useEffect, useRef, RefObject } from 'react';
interface Args extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = '0%',
  freezeOnceVisible = false,
}: Args): { entry: IntersectionObserverEntry; ref: RefObject<HTMLDivElement> } {
  const elementRef = useRef<HTMLDivElement | null>(null);

  const [entry, setEntry] = useState<IntersectionObserverEntry>();

  const frozen = entry?.isIntersecting && freezeOnceVisible;

  const updateEntry = ([entry]: IntersectionObserverEntry[]): void => {
    setEntry(entry);
  };

  useEffect(() => {
    const node = elementRef?.current; // DOM Ref
    const hasIOSupport = !!window.IntersectionObserver;

    if (!hasIOSupport || frozen || !node) return;

    const observerParams = { threshold, root, rootMargin };
    const observer = new IntersectionObserver(updateEntry, observerParams);

    observer.observe(node);

    return () => observer.disconnect();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    elementRef?.current,
    JSON.stringify(threshold),
    root,
    rootMargin,
    frozen,
  ]);

  return { entry, ref: elementRef };
}

function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Remember the latest callback if it changes.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    // Don't schedule if no delay is specified.
    // Note: 0 is a valid value for delay.
    if (!delay && delay !== 0) {
      return;
    }
    savedCallback.current();
    const id = setInterval(() => savedCallback.current(), delay);

    return () => clearInterval(id);
  }, [delay]);
}

const Ball = ({ id, position, onClick, onRemove, duration, diameter }) => {
  const { entry, ref } = useIntersectionObserver({});
  const isVisible = entry?.isIntersecting;

  useEffect(() => {
    if (typeof isVisible === 'boolean' && !isVisible) {
      onRemove();
    }
  }, [isVisible]);

  return (
    <div
      ref={ref}
      className="ball"
      style={{
        top: '0px',
        left: `${position}px`,
        animationDuration: `${duration}s`,
        width: `${diameter}px`,
        height: `${diameter}px`,
      }}
      onMouseDown={onClick}
    />
  );
};

const generateRandomBall = () => {
  const randomDiameter = Math.floor(Math.random() * (100 - 10) + 10);
  // calculate width
  const randomPosition = Math.floor(Math.random() * 350);

  return {
    id: crypto.randomUUID(),
    position: randomPosition,
    diameter: randomDiameter,
  };
};

export default function App() {
  const [balls, setBalls] = useState([]);
  const [isPlaying, setPlaying] = useState<boolean>(false);
  const [points, setPoints] = useState(0);
  const [duration, setDuration] = useState(10);
  const ref = useRef();

  useInterval(
    () => {
      setBalls((prev) => [...prev, generateRandomBall()]);
    },
    isPlaying ? 1000 : null
  );

  const removeBall = (id) => {
    const newBalls = balls.filter((ball) => {
      return id !== ball.id;
    });
    setBalls(newBalls);
  };

  return (
    <div className="container">
      <div className="panel">
        <div className="top-panel">
          <div>Number of balls: {balls.length}</div>
          <div>Points: {points}</div>
          <button
            style={{ marginTop: '5px' }}
            onClick={() => {
              setPlaying(!isPlaying);
            }}
          >
            {isPlaying ? 'Pause' : 'Start'}
          </button>
        </div>
        <div className="slidecontainer">
          <input
            type="range"
            min="1"
            max="100"
            value="50"
            className="slider"
            id="myRange"
          />
        </div>
      </div>
      <div className="window" ref={ref}>
        {balls.map(({ id, position, diameter }) => {
          return (
            <Ball
              key={id}
              id={id}
              position={position}
              diameter={diameter}
              duration={duration}
              onRemove={() => {
                removeBall(id);
              }}
              onClick={() => {
                setPoints(points + 1);
                removeBall(id);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
