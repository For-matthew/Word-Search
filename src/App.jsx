import React, { useState, useEffect, useRef, useCallback } from 'react';
import Confetti from 'react-confetti';

const GRID_SIZE = 12;

const WORDS_TO_FIND = [
  { display: "UNITY", search: "UNITY", theme: "theme-blue" },
  { display: "SUBMIT", search: "SUBMIT", theme: "theme-yellow" },
  { display: "OBEY", search: "OBEY", theme: "theme-red" },
  { display: "CHURCH LEADER", search: "CHURCHLEADER", theme: "theme-green" },
  { display: "LORD JESUS", search: "LORDJESUS", theme: "theme-purple" },
  { display: "ALMIGHTY GOD", search: "ALMIGHTYGOD", theme: "theme-orange" }
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function App() {
  const [grid, setGrid] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [dragStartCell, setDragStartCell] = useState(null); 
  const [wrongCells, setWrongCells] = useState([]);
  const [foundWordsMap, setFoundWordsMap] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });
  
  const gridRef = useRef(null);

  useEffect(() => {
    setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const generateBoard = useCallback(() => {
    let newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
    
    const placeWord = (word) => {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 500) { 
        attempts++;
        const dir = Math.floor(Math.random() * 3); 
        let row, col;
        
        if (dir === 0) {
          row = Math.floor(Math.random() * GRID_SIZE);
          col = Math.floor(Math.random() * (GRID_SIZE - word.length + 1));
        } else if (dir === 1) {
          row = Math.floor(Math.random() * (GRID_SIZE - word.length + 1));
          col = Math.floor(Math.random() * GRID_SIZE);
        } else {
          row = Math.floor(Math.random() * (GRID_SIZE - word.length + 1));
          col = Math.floor(Math.random() * (GRID_SIZE - word.length + 1));
        }
        
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          let r = row, c = col;
          if (dir === 0) c += i;
          else if (dir === 1) r += i;
          else if (dir === 2) { r += i; c += i; }
          if (newGrid[r][c] !== '' && newGrid[r][c] !== word[i]) {
            canPlace = false;
            break;
          }
        }
        
        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            let r = row, c = col;
            if (dir === 0) c += i;
            else if (dir === 1) r += i;
            else if (dir === 2) { r += i; c += i; }
            newGrid[r][c] = word[i];
          }
          placed = true;
        }
      }
      return placed;
    };

    WORDS_TO_FIND.forEach(wordObj => {
      if (!placeWord(wordObj.search)) {
          console.warn(`Could not place ${wordObj.search}`);
      }
    });

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (newGrid[r][c] === '') {
          newGrid[r][c] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
        }
      }
    }
    
    setGrid(newGrid);
    setFoundWordsMap({});
    setSelectedCells([]);
    setWrongCells([]);
    setDragStartCell(null);
  }, []);

  useEffect(() => {
    generateBoard();
  }, [generateBoard]);

  const resetGame = () => {
    generateBoard();
  };

  const getCellId = (r, c) => `${r}-${c}`;

  const getCellFromTouch = (touch) => {
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const cellEl = el?.closest ? el.closest('.grid-cell') : el; 
    if (cellEl && cellEl.dataset.row && cellEl.dataset.col) {
      return { r: parseInt(cellEl.dataset.row), c: parseInt(cellEl.dataset.col), letter: cellEl.dataset.letter };
    }
    return null;
  };

  const startDrag = (r, c, letter) => {
    if (wrongCells.length > 0) return; 
    setIsDragging(true);
    const initialCell = { r, c, id: getCellId(r, c), letter };
    setDragStartCell(initialCell);
    setSelectedCells([initialCell]);
  };

  const continueDrag = (r, c) => {
    if (!isDragging || !dragStartCell) return;
    
    const dr = r - dragStartCell.r;
    const dc = c - dragStartCell.c;
    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);

    if (absDr === 0 || absDc === 0 || absDr === absDc) {
      const stepR = absDr === 0 ? 0 : dr / absDr;
      const stepC = absDc === 0 ? 0 : dc / absDc;
      const length = Math.max(absDr, absDc);
      
      const newSelection = [];
      for (let i = 0; i <= length; i++) {
        const currR = dragStartCell.r + (stepR * i);
        const currC = dragStartCell.c + (stepC * i);
        newSelection.push({ 
          r: currR, 
          c: currC, 
          id: getCellId(currR, currC), 
          letter: grid[currR][currC] 
        });
      }
      setSelectedCells(newSelection);
    }
  };

  const endDrag = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragStartCell(null);

    if (selectedCells.length === 0) return;

    const currentWord = selectedCells.map(s => s.letter).join('');
    const reversedWord = currentWord.split('').reverse().join('');

    let matchFound = false;

    WORDS_TO_FIND.forEach(wordObj => {
      if (foundWordsMap[wordObj.search]) return; 

      if (currentWord === wordObj.search || reversedWord === wordObj.search) {
        setFoundWordsMap(prev => ({
          ...prev,
          [wordObj.search]: {
            cells: selectedCells.map(c => c.id),
            theme: wordObj.theme
          }
        }));
        matchFound = true;
      }
    });

    if (matchFound) {
      setSelectedCells([]); 
    } else {
      const wrongIds = selectedCells.map(c => c.id);
      setWrongCells(wrongIds);
      setTimeout(() => {
        setWrongCells([]);
        setSelectedCells([]);
      }, 500); 
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length > 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    const cell = getCellFromTouch(touch);
    if (cell) startDrag(cell.r, cell.c, cell.letter);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDragging) return;
    const touch = e.touches[0];
    const cell = getCellFromTouch(touch);
    if (cell) continueDrag(cell.r, cell.c);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    endDrag();
  };

  const allFoundWordsCount = Object.keys(foundWordsMap).length;
  const isWinner = allFoundWordsCount === WORDS_TO_FIND.length && WORDS_TO_FIND.length > 0;

  if (grid.length === 0) return null; 

  return (
    <>
      {/* WARNING OVERLAY KAPAG NAKA-PORTRAIT ANG PHONE */}
      <div className="portrait-warning">
        <div className="phone-icon"></div>
        <h2>OOPS!</h2>
        <p>Please rotate your phone<br/>to landscape to play!</p>
      </div>

      {isWinner && (
        <div className="modal-overlay">
          <Confetti 
            width={windowDimensions.width} 
            height={windowDimensions.height} 
            recycle={true}
          />
          <div className="modal-content">
            <h2>GREAT JOB!</h2>
            <p>You found all the words.</p>
            <button className="play-again-btn" onClick={resetGame}>PLAY AGAIN</button>
          </div>
        </div>
      )}

      <div className="layout-container">
        <div className="main-content">
          <div className="header-box">
            <div className="logo-text-container">
              <div className="logo-image-container">
                <img src="/cws-logo.png" alt="CWS Logo" className="real-cws-logo" />
              </div>
              <span className="logo-word-search">
                <span className="letter-w">W</span>
                <span className="letter-o">O</span>
                <span className="letter-r">R</span>
                <span className="letter-d">D</span>
                <span className="space"> </span>
                <span className="letter-s">S</span>
                <span className="letter-e">E</span>
                <span className="letter-a">A</span>
                <span className="letter-r2">R</span>
                <span className="letter-c">C</span>
                <span className="letter-h">H</span>
              </span>
            </div>
            <p className="subtitle">VISITATION ACTIVITY</p>
          </div>

          <div className="game-area">
            <div 
              className="grid-container" 
              ref={gridRef}
              onMouseLeave={endDrag}
              onTouchMove={handleTouchMove}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {grid.map((row, r) => (
                row.map((letter, c) => {
                  const cellId = getCellId(r, c);
                  const isSelected = selectedCells.some(s => s.id === cellId);
                  const isWrong = wrongCells.includes(cellId);
                  
                  let foundTheme = null;
                  for (const wordKey in foundWordsMap) {
                    if (foundWordsMap[wordKey].cells.includes(cellId)) {
                      foundTheme = foundWordsMap[wordKey].theme;
                      break;
                    }
                  }

                  let className = "grid-cell";
                  if (foundTheme) className += ` found ${foundTheme}`;
                  else if (isWrong) className += " wrong";
                  else if (isSelected) className += " selected";

                  return (
                    <div 
                      key={cellId} 
                      className={className}
                      data-row={r}
                      data-col={c}
                      data-letter={letter}
                      onMouseDown={() => startDrag(r, c, letter)}
                      onMouseEnter={() => continueDrag(r, c)}
                      onMouseUp={endDrag}
                    >
                      {letter}
                    </div>
                  );
                })
              ))}
            </div>

            <div className="side-panel">
              <h3>WORDS TO FIND:</h3>
              <ul className="word-list">
                {WORDS_TO_FIND.map((wordObj) => {
                  const foundWordData = foundWordsMap[wordObj.search];
                  const isFound = !!foundWordData;
                  
                  return (
                    <li 
                      key={wordObj.search} 
                      className={isFound ? `word-item found-word ${foundWordData.theme}` : "word-item"}
                    >
                      {/* Dito natin idinagdag yung Star icon kapag nahanap */}
                      {isFound && <span style={{ marginRight: '5px' }}>⭐</span>}
                      {wordObj.display}
                    </li>
                  );
                })}
              </ul>
              
              <button className="reset-btn" onClick={resetGame}>
                RESET GAME
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}