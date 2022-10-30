import * as React from 'react';
import './style.scss';

import { useState, useEffect, useRef, RefObject, useMemo } from 'react';
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
const generateRandomBall = (windowWidth: string) => {
  const minDiameter = 10;
  const maxDiameter = 100;
  const randomDiameter = Math.floor(
    Math.random() * (maxDiameter - minDiameter) + minDiameter
  );
  const maxPosition = Number(windowWidth) - randomDiameter;
  const randomLeftPosition = Math.floor(Math.random() * maxPosition);
  const point = Math.floor(100 / randomDiameter);

  return {
    id: crypto.randomUUID(),
    leftPosition: randomLeftPosition,
    diameter: randomDiameter,
    point,
  };
};
const Ball = ({ id, leftPosition, onClick, onRemove, duration, diameter }) => {
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
        top: `-${diameter}px`,
        left: `${leftPosition}px`,
        width: `${diameter}px`,
        height: `${diameter}px`,
        animationDuration: `${duration}s`,
      }}
      onMouseDown={onClick}
    />
  );
};

export default function App() {
  const [balls, setBalls] = useState([]);
  const [isPlaying, setPlaying] = useState<boolean>(false);
  const [points, setPoints] = useState(0);
  const [speed, setSpeed] = useState(5);
  const ref = useRef();
  const windowHeight = ref?.current?.clientHeight;
  const windowWidth = ref?.current?.clientWidth;

  const duration = useMemo(() => {
    return 1000 / (speed * 10);
  }, [speed]);

  useInterval(
    () => {
      setBalls((prev) => [...prev, generateRandomBall(windowWidth)]);
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
          <div className="points">{points}</div>
          <button
            className="button"
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
            max="10"
            value={speed}
            className="slider"
            onChange={(e) => {
              setSpeed(Number(e.target.value));
            }}
          />
          <div>Speed</div>
        </div>
      </div>
      <div className="window" ref={ref}>
        {balls.map(({ id, leftPosition, diameter, point }) => {
          return (
            <Ball
              key={id}
              id={id}
              leftPosition={leftPosition}
              diameter={diameter}
              duration={duration}
              onRemove={() => {
                removeBall(id);
              }}
              onClick={() => {
                setPoints(points + point);
                removeBall(id);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
