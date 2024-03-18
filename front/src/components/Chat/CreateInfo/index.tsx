import { useState, useContext } from "react";
import styled from "styled-components";
import { SoundContext } from "../../../utils/context/SoundContext";

const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.6);
	border-radius: 5px;
	z-index: 10;
`;

const Container = styled.div`
	width: 50%;
	height: 50%;
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	border: 2px solid dimgrey;
	border-radius: 5px;
	background-color: rgb(30, 30, 30);
	display: flex;
	flex-direction: column;
	justify-content: space-evenly;
	align-items: center;
	text-align: center;
	z-index: 11;
`

const Text = styled.p`
	font-size: 2.5vh;
`

const LineBreak = styled.span`
	display: block;
	margin-bottom: 1vh;
`;

const StyledButton = styled.button`
	width: 25%;
	padding: 0.7vh;
	margin-top: -2vh;
	font-size: 2vh;
	border: 1px solid dimgrey;
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`;

function CreateInfo(props: {setInfo: (value: boolean) => void})
{
	const [okayPressed, setOkayPressed] = useState(false);
	const { handleSFX } = useContext(SoundContext);

	const handleGoBack = () => {
		props.setInfo(false);
		setOkayPressed(true);
		handleSFX("goBack");
	}
	if (okayPressed)
		return (null);
	return (<Overlay>
				<Container>
					<Text>
						- Group Name: Required, 2 to 10 characters.<LineBreak />
						- Password: Optional, 4 to 30 characters.<LineBreak />
						- Capacity: Required, 1 to 10 users.<LineBreak />
						- Description: Optional, 6 to 60 characters.<LineBreak />
						We wish you an enjoyable chat experience!
					</Text>
					<StyledButton onClick={handleGoBack}>Okay</StyledButton>
				</Container>
			</Overlay>);
}

export default CreateInfo;
