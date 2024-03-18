import { useState, useEffect } from 'react';
import styled from 'styled-components'
import useWindowSize from '../../utils/hooks/WindowSize/useWindowSize'

const Container = styled.div`
	position: fixed;
	width: 100%;
	height: 100%;
	background-color: black;
	color: white;
	justify-content: center;
	align-items: center;
	text-align: center;
	z-index: 999;
	display: flex;
	flex-direction: column;
	justify-content: start;
`;

const SubContainer = styled.div`
	width: 100%;
	height: 75%;
	display: flex;
	flex-direction: column;
	justify-content: center;
`

const Title = styled.p`
	font-size: 4vh;
`

const Text = styled.p`
	font-size: 3vh;
	margin: 0.1vh;
`

function WindowSize()
{
	const windowSize = useWindowSize();
	const [isWindowTooSmall, setIsWindowTooSmall] = useState(false);

	useEffect(() => {
		if (windowSize.x < 1024 || windowSize.y < 720)
			setIsWindowTooSmall(true);
		else
			setIsWindowTooSmall(false);
	}, [windowSize]);

	return (<Container style={{display: isWindowTooSmall ? "flex" : "none"}}>
				<SubContainer>
					<Title>Please enlarge the window<br />for a better user experience.</Title>
					<Text>Minimum resolution required : <span style={{fontSize: "3.5vh"}}>1024x720</span></Text>
					<Text>Current resolution : <span style={{fontSize: "3.5vh"}}>{windowSize.x}x{windowSize.y}</span></Text>
				</SubContainer>
			</Container>);
}

export default WindowSize;
