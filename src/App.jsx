import React, { useState, useEffect, useRef, useCallback } from 'react';

const GRID_SIZE = 12;

// Nilagyan natin ng kanya-kanyang theme ang bawat salita
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
  const [wrongCells, setWrongCells] = useState([]);
  const [foundWordsMap, setFoundWordsMap] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  
  const gridRef = useRef(null);

  const generateBoard = useCallback(() => {
    let newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
    
    const placeWord = (word) => {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 100) {
        attempts++;
        const dir = Math.floor(Math.random() * 3); 
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        
        let canPlace = true;
        
        if (dir === 0 && col + word.length > GRID_SIZE) canPlace = false;
        else if (dir === 1 && row + word.length > GRID_SIZE) canPlace = false;
        else if (dir === 2 && (row + word.length > GRID_SIZE || col + word.length > GRID_SIZE)) canPlace = false;
        
        if (canPlace) {
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
    if (el && el.dataset.row && el.dataset.col) {
      return { r: parseInt(el.dataset.row), c: parseInt(el.dataset.col), letter: el.dataset.letter };
    }
    return null;
  };

  const startDrag = (r, c, letter) => {
    if (wrongCells.length > 0) return; 
    setIsDragging(true);
    setSelectedCells([{ r, c, id: getCellId(r, c), letter }]);
  };

  const continueDrag = (r, c, letter) => {
    if (!isDragging) return;
    const id = getCellId(r, c);
    if (!selectedCells.find(cell => cell.id === id)) {
      setSelectedCells(prev => [...prev, { r, c, id, letter }]);
    }
  };

  const endDrag = () => {
    if (!isDragging) return;
    setIsDragging(false);

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
            theme: wordObj.theme // I-save ang kulay na nakalaan sa salita
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
    if (cell) continueDrag(cell.r, cell.c, cell.letter);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    endDrag();
  };

  const allFoundWordsCount = Object.keys(foundWordsMap).length;

  if (grid.length === 0) return null; 

  return (
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
                    onMouseEnter={() => continueDrag(r, c, letter)}
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
                    {wordObj.display}
                  </li>
                );
              })}
            </ul>
            
            <button className="reset-btn" onClick={resetGame}>
              RESET GAME
            </button>

            {allFoundWordsCount === WORDS_TO_FIND.length && (
              <div className="winner-message">
                <h3>GREAT JOB!</h3>
                <p>You found all the words.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}