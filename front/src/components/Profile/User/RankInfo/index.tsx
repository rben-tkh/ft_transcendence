import styled from "styled-components";
import { SoundContext } from "../../../../utils/context/SoundContext";
import { useContext } from "react";

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
	justify-content: center;
	align-items: center;
	text-align: center;
	font-size: 1.5vw;
	z-index: 11;
`

const StyledTH = styled.th`
	padding: 1vh 1vw;
	font-weight: 500;
`

const StyledTD = styled.th`
	padding: 1vh 1vw;
	font-weight: 400;
`

const CloseButton = styled.button`
	width: 15%;
	margin-top: 2vh;
	font-size: 1vw;
	border: 1px solid dimgrey;
	border-radius: 5px;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`

function RankInfo(props: {setRankInfo: (value: boolean) => void})
{
	const { handleSFX } = useContext(SoundContext)

	const handleClic = () => {
		props.setRankInfo(false)
		handleSFX("goBack");
	}
	return (<Overlay><Container>
				<table>
					<caption style={{fontSize: "4vh", padding: '0.5vw'}}>All Ranks</caption>
					<tbody>
						<tr>
							<StyledTH>Name</StyledTH>
							<StyledTH>Rookie</StyledTH>
							<StyledTH>Novice</StyledTH>
							<StyledTH>Adept</StyledTH>
							<StyledTH>Master</StyledTH>
							<StyledTH>Legend</StyledTH>
						</tr>
						<tr>
							<StyledTD>Win</StyledTD>
							<StyledTD>+4</StyledTD>
							<StyledTD>+3</StyledTD>
							<StyledTD>+3</StyledTD>
							<StyledTD>+2</StyledTD>
							<StyledTD>+1</StyledTD>
						</tr>
						<tr>
							<StyledTD>Lose</StyledTD>
							<StyledTD>-0</StyledTD>
							<StyledTD>-1</StyledTD>
							<StyledTD>-2</StyledTD>
							<StyledTD>-3</StyledTD>
							<StyledTD>-3</StyledTD>
						</tr>
						<tr>
							<StyledTD>RR</StyledTD>
							<StyledTD>0-10</StyledTD>
							<StyledTD>10-20</StyledTD>
							<StyledTD>20-30</StyledTD>
							<StyledTD>30-40</StyledTD>
							<StyledTD>40+</StyledTD>
						</tr>
					</tbody>
				</table>
				<CloseButton onClick={handleClic}>Close</CloseButton>
			</Container></Overlay>);
}

export default RankInfo;
