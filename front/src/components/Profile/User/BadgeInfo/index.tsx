import { useContext } from "react";
import styled from "styled-components";
import { SoundContext } from "../../../../utils/context/SoundContext";
import Unknown from "../../../../assets/images/achievements/Unknown.png"

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
	width: 60%;
	height: 55%;
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
	margin: 1vh 0vw;
`

const CloseButton = styled.button`
	width: 15%;
	font-size: 2vh;
	border: 1px solid dimgrey;
	border-radius: 5px;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`

function BadgeInfo(props: {setBadgeInfo: (value: boolean) => void})
{
	const { handleSFX } = useContext(SoundContext)

	const handleClic = () => {
		props.setBadgeInfo(false)
		handleSFX("goBack");
	}
	return (<Overlay>
				<Container>
					<img style={{height: "8vh"}} src={Unknown} alt="Unknown.png"/>
					<div>
						<Text>Explore your achievements in the completion system.</Text>
						<Text>Achievements, unlockable only in online mode, are showcased here.</Text>
						<Text>Choose from the unlocked badges to display on the leaderboard.</Text>
						<Text>Customize your profile with your accomplishments,<br/>and stand out in the Pong competition!</Text>
					</div>
					<CloseButton onClick={handleClic}>Close</CloseButton>
				</Container>
			</Overlay>);
}

export default BadgeInfo;
