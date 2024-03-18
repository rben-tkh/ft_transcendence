import { createGlobalStyle } from 'styled-components';
import Background from '../../assets/images/gif/background.gif';

const GlobalStyle = createGlobalStyle`
	* {
		color: white;
		text-decoration: none;
		outline: none;
		font-family: 'Pixelify Sans', sans-serif;
		user-select: none;
		text-shadow: 2px 2px 4px rgb(50, 50, 50);
		caret-color: darkgrey;
	}
	body {
		background: url(${Background});
		margin: 0;
	}
	img, a {
		user-select: none;
		-moz-user-select: none;
		-webkit-user-drag: none;
		-webkit-touch-callout: none;
		-ms-user-select: none;
  }
	::selection {
		background: none;
	}
	::-webkit-scrollbar {
		width: 0.3vw;
	}
	::-webkit-scrollbar-track {
		background: rgba(25, 25, 25, 0.95);
		border-radius: 10px;
	}
	::-webkit-scrollbar-thumb {
		background: dimgrey;
		border-radius: 10px;
	}
	::-webkit-scrollbar-thumb:hover {
		background: dimgrey;
	}
`;

export default GlobalStyle;
