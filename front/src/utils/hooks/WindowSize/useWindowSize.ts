import { useState, useEffect } from 'react';

function useWindowSize()
{
	const [windowSize, setWindowSize] = useState({ x: window.innerWidth, y: window.innerHeight });

	useEffect(() => {
		const handleResize = () => {
			setWindowSize({ x: window.innerWidth, y: window.innerHeight });
		}
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [window.innerWidth, window.innerHeight]);
	return (windowSize);
}

export default useWindowSize;
