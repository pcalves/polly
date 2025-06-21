import { useCallback, useEffect, useRef, useState } from "react";

interface UseScrollDirectionProps {
  hideThreshold?: number;
}

interface ScrollState {
  shouldHideHeader: boolean;
  isAtTop: boolean;
}

export function useScrollDirection({
  hideThreshold = 100,
}: UseScrollDirectionProps = {}): [
  ScrollState,
  (element: HTMLElement | null) => void,
] {
  const [scrollState, setScrollState] = useState<ScrollState>({
    shouldHideHeader: false,
    isAtTop: true,
  });

  const lastScrollY = useRef(0);
  const scrollElement = useRef<HTMLElement | null>(null);
  const ticking = useRef(false);

  const updateScrollState = useCallback(() => {
    if (!scrollElement.current) return;

    const currentScrollY = scrollElement.current.scrollTop;
    const difference = currentScrollY - lastScrollY.current;

    if (Math.abs(difference) < 1) {
      ticking.current = false;
      return;
    }

    const isScrollingDown = difference > 0;
    const isScrollingUp = difference < 0;
    const isAtTop = currentScrollY <= 10;

    let shouldHideHeader = false;

    if (isAtTop || isScrollingUp) {
      shouldHideHeader = false;
    } else if (isScrollingDown && currentScrollY > hideThreshold) {
      shouldHideHeader = true;
    }

    setScrollState({
      shouldHideHeader,
      isAtTop,
    });

    lastScrollY.current = currentScrollY;
    ticking.current = false;
  }, [hideThreshold]);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(updateScrollState);
      ticking.current = true;
    }
  }, [updateScrollState]);

  const setRef = useCallback(
    (element: HTMLElement | null) => {
      if (scrollElement.current) {
        scrollElement.current.removeEventListener("scroll", handleScroll);
      }

      scrollElement.current = element;

      if (element) {
        element.addEventListener("scroll", handleScroll, { passive: true });

        const initialScrollY = element.scrollTop;
        setScrollState({
          shouldHideHeader: false,
          isAtTop: initialScrollY <= 10,
        });
        lastScrollY.current = initialScrollY;
      }
    },
    [handleScroll]
  );

  useEffect(() => {
    return () => {
      if (scrollElement.current) {
        scrollElement.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  return [scrollState, setRef];
}
