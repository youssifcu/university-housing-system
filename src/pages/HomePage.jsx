import { useEffect } from 'react';
import { useAIChatContext } from '../context/AIChatContext';

const HomePage = () => {
  const { setScreenContext } = useAIChatContext();

  useEffect(() => {
    setScreenContext({
      screen: 'home',
      pageTitle: 'Home Page',
      guidance:
        'This is the public landing page for the university housing system. No private dashboard data is loaded here.',
    });
  }, [setScreenContext]);

  return (
    <div>
      <h1>Home Page</h1>
    </div>
  );
};

export default HomePage;
