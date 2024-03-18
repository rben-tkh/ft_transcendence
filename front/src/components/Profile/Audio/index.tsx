import { useState, useContext, ChangeEvent, useEffect } from "react";
import { SoundContext } from "../../../utils/context/SoundContext";
import useSound from 'use-sound';
import ClicSFX from '../../../assets/sounds/sfx/ClicSFX.wav'
import styled from 'styled-components'

const Container = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
`;

const MasterVolume = styled.div`
	width: 70%;
	display: flex;
	justify-content: start;
	align-items: center;
	text-align: center;
	margin-bottom: 2vh;
`

const Text = styled.p`
	font-size: 2.7vh;
	font-weight: 300;
	margin: 0vh 2vw;
`

const VolumeInput = styled.input`
	width: 50%;
	appearance: none;
	-webkit-appearance: none;
	background: transparent;
	&::-webkit-slider-thumb {
		appearance: none;
		-webkit-appearance: none;
		width: 1vw;
		height: 1vh;
		border-radius: 4px;
		background-color: grey;
		cursor: pointer;
		&:hover{background-color: rgb(150, 150, 150);};
	}
	&::-webkit-slider-runnable-track {
		-webkit-appearance: none;
		appearance: none;
		background: rgb(75, 75, 75);
		border: 1px solid dimgrey;
		border-radius: 5px;
		cursor: pointer;
		&:hover{background-color: rgb(80, 80, 80);};
	}
`

const MenuButton = styled.button`
	width: 80%;
	padding: 1.5vh;
	margin: 1vh;
	font-size: 2.5vh;
	border: 1px solid dimgrey;
	border-radius: 5px;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
	cursor: pointer;
`;

const PlaylistContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	text-align: center;
	width: 50%;
	margin-top: 2vh;
`;

function Audio()
{
	const { setVolumeChanged, masterVolume, setMasterVolume, handleSFX, setSoundFX, menuSFX, gameSFX, setGameMusic, battleMusic, setBattleMusic, gameMusic, playlist, currentSong, handleChangeMusic, setMenuMusic, menuMusic } = useContext(SoundContext);
	const [changed, setChanged] = useState(false);
	const [clicSFX] = useSound(ClicSFX, { volume: (0.25 * masterVolume) });

	const handleFXSound = (type: boolean, name: string) => {
		type ? handleSFX("goBack") : (menuSFX || name === "menu") && clicSFX();
		setSoundFX(name)
	}
	const handleGameSound = () => {
		gameMusic ? handleSFX("goBack") : handleSFX("clic");
		setGameMusic();
	}
	const handleMusicSound = () => {
		menuMusic ? handleSFX("goBack") : handleSFX("clic");
		setMenuMusic();
	}
	const handleChangingMusic = (next: boolean) => {
		if (!changed)
		{
			setChanged(true);
			handleChangeMusic(next);
			handleSFX("clic");
			setTimeout(() => setChanged(false), 1000);
		}
	}
	const handleBattleSound = () => {
		battleMusic ? handleSFX("goBack") : handleSFX("clic");
		setBattleMusic();
	}
	const handleChangeVolume = (e: ChangeEvent<HTMLInputElement>) => {
		setMasterVolume(parseFloat(e.target.value));
		setVolumeChanged(true);
	};
	useEffect(() => {
		const timeoutId = setTimeout(() => setVolumeChanged(false), 1000);
		return () => clearTimeout(timeoutId);
	}, [masterVolume]);
	return(<Container>
				<MasterVolume>
					<Text style={{fontSize: "3vh"}}>Master Volume : </Text>
					<VolumeInput type="range" min={0} max={2} value={masterVolume} step={0.1} onChange={handleChangeVolume}/>
					<Text style={{fontSize: "2.5vh"}}>{(masterVolume * 50).toFixed(0)}%</Text>
				</MasterVolume>
				<MenuButton onClick={() => handleFXSound(menuSFX, "menu")}>{menuSFX ? "Mute" : "Unmute"} Menu SFX</MenuButton>
				<MenuButton onClick={() => handleFXSound(gameSFX, "game")}>{gameSFX ? "Mute" : "Unmute"} Game SFX</MenuButton>
				<MenuButton onClick={handleMusicSound}>{menuMusic ? "Mute" : "Unmute"} Music In Lobby</MenuButton>
				<MenuButton onClick={handleGameSound}>{gameMusic ? "Mute" : "Unmute"} Music In Game</MenuButton>
				<MenuButton onClick={handleBattleSound}>Battle Music Auto: {battleMusic ? "On" : "Off"}</MenuButton>
				<PlaylistContainer>
					<MenuButton style={{width: "10%"}} onClick={() => handleChangingMusic(false)}>{changed ? "..." : "<"}</MenuButton>
					<Text style={{width: "30%"}}>{playlist[currentSong].title}</Text>
					<MenuButton style={{width: "10%"}} onClick={() => handleChangingMusic(true)}>{changed ? "..." : ">"}</MenuButton>
				</PlaylistContainer>
			</Container>)
}

export default Audio;
