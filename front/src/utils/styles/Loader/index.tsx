import styled, { keyframes } from 'styled-components'

const moveBall = keyframes`
	0%, 100%	{
		height: 12%;
		width: 20%;
		margin-left: -0.1vw;
	}

	12%, 88% {
		height: 10%;
		width: 22%;
	}

	25%, 75%	{
		height: 9%;
		width: 24%;
	}

	45% {
		height: 12%;
		width: 20%;
		margin-left: 2vw;
	}
`;

const movePaddleUp = keyframes`
	0%, 100% {
		margin-top: 2vh;
	}
	50% {
		margin-top: 5.5vh;
	}
`;

const movePaddleDown = keyframes`
	0%, 100% {
		margin-top: 2vh;
	}
	50% {
		margin-top: 5.5vh;
	}
`;

const PongAnimation = styled.div`
	display: grid;
	grid-template-columns: 30% 40% 30%;
	width: 6vw;
	height: 12vh;
	background-color: rgba(60, 60, 60, 0.95);
	border: 2px solid dimgrey;
	border-radius: 10px;
`;

const PaddleRight = styled.div`
	width: 25%;
	height: 40%;
	border-radius: 3px;
	justify-self: start;
	background-color: #ecf0f1;
	animation: ${movePaddleUp} 2s ease-in-out infinite alternate;
`;

const PaddleLeft = styled.div`
	width: 25%;
	height: 40%;
	border-radius: 3px;
	justify-self: end;
	background-color: #ecf0f1;
	animation: ${movePaddleDown} 2.5s ease-in-out infinite alternate;
`;

const Ball = styled.div`
	background-color: white;
	border-radius: 50%;
	align-self: center;
	animation: ${moveBall} 1.5s linear infinite;
`;

function Loader()
{
	return (<PongAnimation>
				<PaddleLeft />
				<Ball />
				<PaddleRight />
			</PongAnimation>);
}

export default Loader;
