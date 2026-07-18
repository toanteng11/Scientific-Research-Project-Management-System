import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setNavigate } from '../utils/navigationRef';

/**
 * RouterSetter — Seeds the imperative navigation reference.
 *
 * Must be rendered as a child of <RouterProvider> (inside the router context)
 * so that useNavigate() is available. On mount it writes the live navigate
 * function into the navigationRef module singleton, enabling the Axios
 * response interceptor to perform programmatic navigation outside React.
 *
 * Renders nothing — this is a side-effect-only component.
 */
function RouterSetter() {
  const nav = useNavigate();

  useEffect(() => {
    setNavigate(nav);
  }, [nav]);

  return null;
}

export default RouterSetter;
