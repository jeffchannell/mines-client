import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

/**
 * A small project to learn React JS based on the initial tic-tac-toe tutorial.
 * 
 * @author Jeff Channell
 * @copyright Kopyleft. All Rites Reversed.
 */

/**
 * Tile Class
 * 
 * @author Jeff Channell
 */
class Tile extends React.Component {
    /**
     * Override constructor.
     * 
     * @param {object} props 
     */
    constructor(props) {
        super(props);
        this.state = {
            className: ['tile'],
        };
    }

    render() {
        var className = ['tile'];
        var label = '';
        if ("" === this.props.value) {
            className.push('open');
        } else if ("!" === this.props.value) {
            className.push('flag');
            label = "🏁"
        } else if ("X" === this.props.value) {
            className.push('mine');
            label = "🏁"
        } else if (this.props.value.match(/^[1-8]$/)) {
            className.push('open');
            label = this.props.value;
        } else if ("9" === this.props.value) {
            label = "💣"
            className.push('mine');
        }
        return (
            <button
                className={className.join(' ')}
                onClick={this.props.onClick}
                onMouseDown={this.props.onMouseDown}
            >
                {label}
            </button>
        );
    }
}

/**
 * Row Class
 * 
 * @author Jeff Channell
 */
class Row extends React.Component {
    /**
     * Renders a single tile.
     * 
     * @param {Object} tile
     */
    renderTile(x, y, value) {
        return <Tile
            value={value}
            key={'tile_' + x + '_' + y}
            onClick={(event) => this.props.onClick(event, x, y)}
            onMouseDown={(event) => this.props.onMouseDown(event, x, y)}
        />;
    }

    /**
     * Renders the game board.
     */
    render() {
        return (
            <div
                key={'row_' + this.props.y}
                className="board-row"
            >
                {this.props.cols.map((value, x) => {
                    return this.renderTile(x, this.props.y, value);
                })}
            </div>
        );
    }
}

/**
 * Board Class
 * 
 * @author Jeff Channell
 */
class Board extends React.Component {
    /**
     * Renders a single row.
     * 
     * @param {int} y
     * @param {Array} cols
     */
    renderRow(y, cols) {
        return (
            <Row
                y={y}
                key={"row_" + y}
                cols={cols}
                onClick={(event, x, y) => this.props.onClick(event, x, y)}
                onMouseDown={(event, x, y) => this.props.onMouseDown(event, x, y)}
            />
        );
    }

    /**
     * Renders the game board.
     */
    render() {
        let start = 0, end = this.props.width, rows = [];
        while (end <= (this.props.width * this.props.height)) {
            rows.push(this.props.tiles.slice(start, end));
            start += this.props.width;
            end += this.props.width;
        }
        return (
            <div>
                {rows.map((cols, y) => {
                    return this.renderRow(y, cols);
                })}
            </div>
        );
    }
}

/**
 * Game Class
 * 
 * @author Jeff Channell
 */
class Game extends React.Component {
    /**
     * Override constructor.
     * 
     * @param {object} props 
     */
    constructor(props) {
        super(props);
        this.state = {
            width: 30,
            height: 16,
            flags: 0,
            setFlags: false,
            tiles: [],
            timer: false,
            totalMines: 99,
            uuid: false,
        };
    }

    endGame() {
        let done = () => {
            this.setState({
                flags: 0,
                tiles: [],
                uuid: false,
            })
        }
        // send a request to the server to start the game
        fetch("http://localhost:55555/games/"+this.state.uuid, {
            method: "DELETE",
        })
        .then(done)
        .catch((error) => {
            console.log(error, "game not created")
            done();
        });
    }

    /**
     * Handle the click action on a button.
     * 
     * @param {int} x
     * @param {int} y
     */
    handleClick(event, x, y) {
        let body = "x=" + x + "&y=" + y;
        if ((1 === event.button) || event.ctrlKey) {
            body += "&flag=1";
        }
        fetch("http://localhost:55555/games/"+this.state.uuid, {
            method: "POST",
            dataType: "JSON",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
            body: body,
        })
        .then(response => {
            return response.json()
        })
        .then(data => {
            this.setState({
                flags: data.flags,
                tiles: data.grid,
            });
        })
        .catch((error) => {
            console.log(error, "game not created")
        });
    }

    handleMouseDown(event, x, y) {
        if (1 === event.button) {
            this.handleClick(event, x, y);
        }
    }

    onChangeWidth(event) {
        return this.onChangeStartState(event, 'width');
    }

    onChangeMines(event) {
        return this.onChangeStartState(event, 'totalMines');
    }

    onChangeHeight(event) {
        return this.onChangeStartState(event, 'height');
    }

    onChangeStartState(event, state) {
        let value = parseInt(event.target.value, 10);
        let newState = {};
        if (value && (0 < value)) {
            newState[state] = value;
            this.setState(newState);
        } else {
            return false;
        }
    }

    /**
     * Generate a random number between min and max
     * 
     * @param {type} min
     * @param {type} max
     * @returns {Number}
     */
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    renderGame() {
        const tiles = this.state.tiles;
        const height = this.state.height;
        const width = this.state.width;
        const flags = this.state.flags;
        return (
            <div className="game">
                <div className="game-info">
                    <div>timer</div>
                    <button
                        className="end-button"
                        onClick={() => this.endGame()}
                        >
                        End Game
                    </button>
                    <div>{flags}</div>
                </div>
                <div className="game-board">
                    <div className="tiles">
                        <Board
                            height={height}
                            width={width}
                            tiles={tiles}
                            onClick={(event, x, y) => this.handleClick(event, x, y)}
                            onMouseDown={(event, x, y) => this.handleMouseDown(event, x, y)}
                        />
                    </div>
                </div>
            </div>
        );
    }

    renderStart() {
        return (
            <div className="game">
                <input
                    name="width"
                    type="number"
                    value={this.state.width}
                    onChange={(e) => this.onChangeWidth(e)}
                />
                <input
                    name="height"
                    type="number"
                    value={this.state.height}
                    onChange={(e) => this.onChangeHeight(e)}
                />
                <input
                    name="bombs"
                    type="number"
                    value={this.state.totalMines}
                    onChange={(e) => this.onChangeMines(e)}
                />
                <button
                    className="start-button"
                    onClick={() => this.startGame()}
                    >
                    Start Game
                </button>
            </div>
        );
    }

    render() {
        return this.state.uuid ? this.renderGame() : this.renderStart();
    }

    startGame() {
        // send a request to the server to start the game
        fetch("http://localhost:55555/games/", {
            method: "POST",
            dataType: "JSON",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
            body: "w="+this.state.width+"&h="+this.state.height+"&m="+this.state.totalMines,
        })
        .then(response => {
            return response.json()
        })
        .then(data => {
            let tiles = Array(this.state.height * this.state.width).fill("?");
            this.setState({
                uuid: data.uuid,
                tiles: tiles,
            })
        })
        .catch((error) => {
            console.log(error, "game not created")
        });
    }
}

ReactDOM.render(
    <Game />,
    document.getElementById('root')
);
