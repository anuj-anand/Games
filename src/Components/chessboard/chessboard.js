import React, { useEffect, useRef } from "react"
import { useState } from "react"
import "./chessboard.css"

import CheckMove from "../../Functions/CheckMove"
import { io } from 'socket.io-client'
import { useParams, useHistory } from "react-router-dom";
import Axios from "axios"
import Cookies from 'js-cookie';

import Tile from "../tile/tile"

let horizontalAxis = ["a", "b", "c", "d", "e", "f", "g", "h"]
let verticalAxis = ["1", "2", "3", "4", "5", "6", "7", "8"]

const initialBoard = [];

initialBoard.push({ image: "/images/br.png", x: 0, y: 0, type: "rook", color: "black" });
initialBoard.push({ image: "/images/br.png", x: 0, y: 7, type: "rook", color: "black" });
initialBoard.push({ image: "/images/bn.png", x: 0, y: 1, type: "knight", color: "black" });
initialBoard.push({ image: "/images/bn.png", x: 0, y: 6, type: "knight", color: "black" });
initialBoard.push({ image: "/images/bb.png", x: 0, y: 2, type: "bishop", color: "black" });
initialBoard.push({ image: "/images/bb.png", x: 0, y: 5, type: "bishop", color: "black" });
initialBoard.push({ image: "/images/bq.png", x: 0, y: 3, type: "queen", color: "black" });
initialBoard.push({ image: "/images/bk.png", x: 0, y: 4, type: "king", color: "black" });

initialBoard.push({ image: "/images/wr.png", x: 7, y: 0, type: "rook", color: "white" });
initialBoard.push({ image: "/images/wr.png", x: 7, y: 7, type: "rook", color: "white" });
initialBoard.push({ image: "/images/wn.png", x: 7, y: 1, type: "knight", color: "white" });
initialBoard.push({ image: "/images/wn.png", x: 7, y: 6, type: "knight", color: "white" });
initialBoard.push({ image: "/images/wb.png", x: 7, y: 2, type: "bishop", color: "white" });
initialBoard.push({ image: "/images/wb.png", x: 7, y: 5, type: "bishop", color: "white" });
initialBoard.push({ image: "/images/wq.png", x: 7, y: 3, type: "queen", color: "white" });
initialBoard.push({ image: "/images/wk.png", x: 7, y: 4, type: "king", color: "white" });

for (let i = 0; i < 8; i++) { initialBoard.push({ image: "/images/bp.png", x: 1, y: i, type: "pawn", color: "black" }) };
for (let i = 0; i < 8; i++) { initialBoard.push({ image: "/images/wp.png", x: 6, y: i, type: "pawn", color: "white" }) };

function Chessboard() {
    const chessBoardRef = useRef(null);
    const [pieces, setPieces] = useState(initialBoard);
    const [initialX, setInitialX] = useState(null);
    const [initialY, setInitialY] = useState(null);
    const [activePiece, setActivePiece] = useState(null);
    const [whoseChanceItIs, setWhoseChanceItIs] = useState(null);

    const [socket, setSocket] = useState(null);
    const [yourColor, setYourColor] = useState(null);

    const [user, setUser] = useState({
        playerName: "",
        playerId: "",
        playerEmailId: "",
        playerPassword: "",
        playerRating: "",
    });

    const [opponentUser, setOpponentUser] = useState({
        playerName: "",
        playerId: "",
        playerEmailId: "",
        playerPassword: "",
        playerRating: "",
    });


    const [b_mail, setB_mail] = useState("");
    const [w_mail, setW_mail] = useState("");

    const [message, setMessage] = useState("");

    const [activeTile, setActiveTile] = useState(null);

    const { roomId } = useParams();
    const history = useHistory();
    const whitepawn = "/images/wp.png";
    const blackpawn = "/images/bp.png";

    useEffect(() => {
        Axios.post(
            "https://ocwa.herokuapp.com/getuser",
            {
                jwtToken: Cookies.get('jwt'),
            })
            .then((res) => {
                if (res.data.msg === 'verified') {
                    setUser(res.data.user);
                }
                else {
                    history.push("/");
                }
            })

    }, []);

    useEffect(() => {
        if (socket === null) {
            return;
        }
        if(user !== null) {
            socket.emit("send-opponent-info",user);
        }
    }, [user,opponentUser,socket])

    useEffect(() => {
        
        if (socket === null) {
            return;
        }
        socket.on("recieve-opponent-info",(oppo)=>{
            setOpponentUser(oppo);
        });
       
    }, [user,opponentUser,socket])

    useEffect(() => {
        const s = io(`https://ocwa.herokuapp.com`);
        setSocket(s);
        s.emit('join', roomId, pieces);
        s.on('room-full', (roomId) => {
            // window.alert(`room ${roomId} is full`)
            history.goBack();
        })
        return () => {
            s.disconnect();
        };
    }, []);

    useEffect(() => {

        if (socket === null) {
            return;
        }
        socket.on("receive-update-checkmate", (loseColor) => {
            const winColor = loseColor === "black" ? "white" : "black";
                setMessage(`It's checkmate !! Player with ${winColor} Wins Game`);
        })

    },[pieces,socket])

    useEffect(() => {

        if (socket === null) {
            return;
        }
        socket.on("receive-update-stalemate", () => {
                setMessage("It's a stalemate");
        })

    }, [pieces, socket])

    useEffect(() => {

        if (socket === null) {
            return;
        }
        socket.on('opponent-left', () => {
            console.log("Your opponent left");
            setMessage("Your opponent left");
        })

    } , [pieces, socket])

        

    
    useEffect(() => {

        if (socket === null) {
            return;
        }
        socket.on('recieve-pieces', (recivedPieces, opponentColor) => {
            if (recivedPieces !== pieces) {
                setWhoseChanceItIs(opponentColor);
                setPieces(recivedPieces);
            }
        })


    }, [pieces, socket]);

    useEffect(() => {

        if (socket === null) {
            return;
        }
        socket.on('load-chessboard', (data, chance, blackemail, whiteemail) => {
            console.log(user.playerEmailId);
            setPieces(data);
            setWhoseChanceItIs(chance);
            setB_mail(blackemail);
            setW_mail(whiteemail);
        })

    }, [pieces, socket]);

    useEffect(() => {
        if (b_mail === user.playerEmailId) { setYourColor("black"); }
        if (w_mail === user.playerEmailId) { setYourColor("white"); }
    }, [b_mail, w_mail, user])



    useEffect(() => {
        if (socket === null) {
            return;
        }
        socket.on('player-color', (playerColor) => {
            setYourColor(playerColor);
            socket.emit('save-my-color', user.playerEmailId, playerColor);
        })
    }, [user, socket])

    const checkMove = new CheckMove();

    let board = [];

    if (yourColor === "black") {
        for (let row = 7; row >= 0; row--) {
            for (let col = 7; col >= 0; col--) {
                board.push(<span>

                    <Tile
                        pieces={pieces}
                        row={row}
                        col={col}
                        key={`${horizontalAxis[row]},${verticalAxis[7 - row]}`}
                        activeTile={activeTile}
                    />
                </span>)
            }
        }
    }
    else {
        for (let row = 0; row <= 7; row++) {
            for (let col = 0; col <= 7; col++) {
                board.push(<span>

                    <Tile
                        pieces={pieces}
                        row={row}
                        col={col}
                        key={`${horizontalAxis[row]},${verticalAxis[7 - row]}`}
                        activeTile={activeTile} />
                </span>)
            }
        }
    }

    function grabPiece(e) {
        const chessboard = chessBoardRef.current;
        const element = e.target
        if (element.classList.contains("chess-piece")) {
//             setInitialY(Math.floor((e.clientX - chessboard.offsetLeft) / 70));
            if(yourColor==="black") {
                setInitialY(Math.floor(8-((e.clientX - chessboard.offsetLeft)/70)));
            } else {
                setInitialY(Math.floor((e.clientX - chessboard.offsetLeft)/70));
            }

            if (yourColor === "black") {
                setInitialX(Math.floor(8 - ((e.clientY - chessboard.offsetTop) / 70)));
            } else {
                setInitialX(Math.floor((e.clientY - chessboard.offsetTop) / 70));
            }

            const x = e.clientX - 35;
            const y = e.clientY - 35;

            element.style.position = "absolute";
            element.style.left = `${x}px`
            element.style.top = `${y}px`
            setActivePiece(element);
        }

        const activePieceX = yourColor === "white" ? Math.floor((e.clientX - chessboard.offsetLeft) / 70) : Math.floor(8-((e.clientX - chessboard.offsetLeft) / 70)) ;
        const activePieceY = yourColor === "white" ? Math.floor((e.clientY - chessboard.offsetTop) / 70) : Math.floor(8 - ((e.clientY - chessboard.offsetTop) / 70));

        console.log(activePieceX, activePieceY);
        
        let aColor = "";
        let aType = "";
        pieces.forEach(p => {

            if (p.x === activePieceY && p.y === activePieceX) {
                aColor = p.color;
                aType = p.type;
            }
        });

        console.log(aColor, aType);
        let validMove = null;
        let array = [];
        for (let row = 0; row <= 7; row++) {
            for (let col = 0; col <= 7; col++) {

                if (yourColor === "black") {
                    if (aType === "queen") {
                        validMove = checkMove.isValidMove(activePieceY, activePieceX, 7 - row, 7 - col, "bishop", aColor, pieces, whoseChanceItIs, yourColor) || checkMove.isValidMove(activePieceY, activePieceX, 7 - row, 7 - col, "rook", aColor, pieces, whoseChanceItIs, yourColor);
                    }
                    else {
                        validMove = checkMove.isValidMove(activePieceY, activePieceX, 7 - row, 7 - col, aType, aColor, pieces, whoseChanceItIs, yourColor);
                    }
                    
                    if (validMove) {
                        console.log(7 - row, 7 - col);
                        array.push({ x: 7 - row, y: 7 - col });
                    }
                }
                else {
                    if (aType === "queen") {
                        validMove = checkMove.isValidMove(activePieceY, activePieceX, row, col, "bishop", aColor, pieces, whoseChanceItIs, yourColor) || checkMove.isValidMove(activePieceY, activePieceX, row, col, "rook", aColor, pieces, whoseChanceItIs, yourColor);
                    }
                    else {
                        validMove = checkMove.isValidMove(activePieceY, activePieceX, row, col, aType, aColor, pieces, whoseChanceItIs, yourColor);
                    }
                    
                    if (validMove) {
                        console.log(row, col);
                        array.push({ x: row, y: col });
                    }
                }

            }
        }

        setActiveTile(array);
    }

    function movePiece(e) {

        const chessboard = chessBoardRef.current;

        if (activePiece) {
            const x = e.clientX - 35;
            const y = e.clientY - 35;
            activePiece.style.position = "absolute";

            activePiece.style.top = `${y}px`
            activePiece.style.left = `${x}px`
        }
    }

    function dropPiece(e) {

        const chessboard = chessBoardRef.current;
        const col_num = yourColor === "white" ? Math.floor((e.clientX - chessboard.offsetLeft)/70) : Math.floor(8-((e.clientX - chessboard.offsetLeft)/70));
        const row_num = yourColor === "white" ? Math.floor((e.clientY - chessboard.offsetTop) / 70) : Math.floor(8 - ((e.clientY - chessboard.offsetTop) / 70));
        const minX = chessboard.offsetLeft;
        const minY = chessboard.offsetTop;
        const maxX = chessboard.offsetLeft + chessboard.clientWidth;
        const maxY = chessboard.offsetTop + chessboard.clientHeight;

        setActiveTile(null);

        if (activePiece) {
            if (e.clientX > maxX || e.clientX < minX || e.clientY > maxY || e.clientY < minY) {
                console.log("outside board");
                activePiece.style.position = 'relative';
                activePiece.style.removeProperty('top');
                activePiece.style.removeProperty('left');
                setActivePiece(null);

            } else {
                const currentPiece = pieces.find(p => p.x === initialX && p.y === initialY);
                const attackedPiece = pieces.find(p => p.x === row_num && p.y === col_num);


                if (currentPiece) {

                    let validMove = null;
                    if (currentPiece.type === 'queen')
                        validMove = checkMove.isValidMove(initialX, initialY, row_num, col_num, 'rook', currentPiece.color, pieces, whoseChanceItIs, yourColor) || checkMove.isValidMove(initialX, initialY, row_num, col_num, 'bishop', currentPiece.color, pieces, whoseChanceItIs, yourColor);
                    else
                        validMove = checkMove.isValidMove(initialX, initialY, row_num, col_num, currentPiece.type, currentPiece.color, pieces, whoseChanceItIs, yourColor);

                    if (yourColor === currentPiece.color && validMove) {
                        
                        setPieces(prevPieces => {
                            prevPieces = prevPieces.filter(p => !(p === attackedPiece))
                            let newPieces = prevPieces.map(p => {
                                if (p === currentPiece) {
                                    p.x = row_num;
                                    p.y = col_num;
                                }

                                if (p.type === "pawn") {
                                    if (p.color === "white" && p.x === 0) {
                                        p.type = "queen";
                                        p.image = "/images/wq.png";
                                    } else if (p.color === "black" && p.x === 7) {
                                        p.type = "queen";
                                        p.image = "/images/bq.png";
                                    }
                                }

                                return p;
                            })

                            let opponentColor = currentPiece.color === "white" ? "black" : "white";

                            socket.emit('send-pieces', newPieces, opponentColor);
                            socket.emit('save-chessboard', newPieces, opponentColor, user.playerEmailId);


                            if (!checkMove.isThereAnyValidMove(opponentColor, newPieces)) {

                                if (!checkMove.isKingNotOnCheck(-1, -1, -1, -1, currentPiece.color, newPieces)) {
                                    console.log("checkmate");
                                    socket.emit("game-end-checkmate", opponentColor);
                                    setMessage(`It's checkmate !! Player with ${currentPiece.color} Wins Game`);
                                }
                                else {
                                    console.log("stalemate");
                                    socket.emit("game-end-stalemate");
                                    setMessage(`It's stalemate!!`);
                                }
                            }

                            return newPieces;
                        })

                        setWhoseChanceItIs(prevwhoseChanceItIs => {
                            if (prevwhoseChanceItIs === "white") {
                                return "black";
                            } else {
                                return "white";
                            }
                        })

                    } else {
                        activePiece.style.position = 'relative';
                        activePiece.style.removeProperty('top');
                        activePiece.style.removeProperty('left');
                    }
                }

            }
            setActivePiece(null);
            setInitialX(null);
            setInitialY(null);
        }

    }
    
    return (
        <>


            <div className="chessboard_wrapper">
                

                    <div className="opponentinfo" style={{ backgroundColor: "white" }}>
                    <div   div className="card">
                            <div className="img">
                            <img src={yourColor === "black" ? whitepawn : blackpawn}/>
                            </div>
                            <div className="infos">
                            <div className="name">
                                <h1>{opponentUser.playerName}</h1>
                                <h3>@{opponentUser.playerId}</h3>
                            </div>
                            
                            <h2>
                                Rating: {opponentUser.playerRating}
                            </h2>
                            </div>
                           
                        </div>
                    </div>


                    <div
                        className="chessboard"
                        ref={chessBoardRef}
                        onMouseDown={e => grabPiece(e)}
                        onMouseMove={e => movePiece(e)}
                        onMouseUp={e => dropPiece(e)}
                    >
                        {board}

                    </div>


                    <div className="myinfo" style={{ backgroundColor: "white" }}>
                    <div   div className="card">
                            <div className="img">
                            <img src={yourColor === "white" ? whitepawn : blackpawn}/>
                            </div>
                            <div className="infos">
                            <div className="name">
                                <h1>{user.playerName}</h1>
                                <h3>@{user.playerId}</h3>
                            </div>
                            
                            <h2>
                                Rating: {user.playerRating}
                            </h2>
                            </div>
                           
                    </div>
                        <button className="button" onClick={(e) => {

                            e.preventDefault();
                            Axios.post(
                                "https://ocwa.herokuapp.com/deleteboard",
                                {
                                    jwtToken: Cookies.get('jwt'),
                                    roomId: roomId,
                                })
                            socket.emit('user-left');
                            
                            window.location.href = "https://chessiiti.netlify.app/chessgame/";
                        }}>Exit</button>
                    </div>

                    <div className="messagebox" style={{ backgroundColor: "white" }}>
                        Its {whoseChanceItIs}'s Turn <br/>
                        {message}
                    </div>
            </div>

        </>
    )
}

export default Chessboard
