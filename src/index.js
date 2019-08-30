import React from 'react';
import ReactDOM from 'react-dom';
import Modal from 'react-modal';
import './index.css';

/**
 * A small project to learn React JS.
 * 
 * @author Jeff Channell
 * @copyright Kopyleft. All Rites Reversed.
 */

const modalStyle = {
    content : {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)'
    }
};

Modal.setAppElement('#root');

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
            alert: false,
            width: 30,
            height: 16,
            flags: 0,
            setFlags: false,
            tiles: [],
            timer: 0,
            totalMines: 99,
            uuid: false,
        };
        this.intervalHandle = null;
        this.tick = this.tick.bind(this);
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
    }

    endGame() {
        let done = () => {
            this.setState({
                flags: 0,
                tiles: [],
                timer: 0,
                uuid: false,
            })
            if (this.intervalHandle) {
                clearInterval(this.intervalHandle);
            }
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
            if (data.error) {
                throw new Error(data.error)
            }
            this.setState({
                flags: data.flags,
                tiles: data.tiles,
            });
            if (data.ended_at && this.intervalHandle) {
                this.openModal(data.won ? "You win!" : "You lost!");
                clearInterval(this.intervalHandle);
            }
        })
        .catch((error) => {
            this.openModal(error);
        });
    }

    handleMouseDown(event, x, y) {
        if (1 === event.button) {
            this.handleClick(event, x, y);
        }
    }

    openModal(message) {
        this.setState({alert: message+""});
    }

    closeModal() {
        this.setState({alert: false});
    }

    onChangeWidth(event) {
        return this.onChangeStartState(event, 'width');
    }

    renderModal() {
        let isOpen = (false !== this.state.alert);
        let message = isOpen ? this.state.alert : "";
        return (
            <Modal
                isOpen={isOpen}
                onRequestClose={this.closeModal}
                style={modalStyle}
                contentLabel="Alert!"
            >
                <div
                    className="modal"
                >
                    <div
                        className="msg"
                    >
                        {message}
                    </div>
                    <button onClick={this.closeModal}>
                        <span role="img" aria-label="close">❌</span>
                    </button>
                </div>
            </Modal>
        );
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
        const timer = this.state.timer;
        return (
            <div className="game">
                <div className="game-info">
                    <div>{timer}</div>
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
                {this.renderModal()}
            </div>
        );
    }

    renderStart() {
        return (
            <div className="game">
                <div className="game-start">
                    <label>Width</label>
                    <input
                        name="width"
                        type="number"
                        value={this.state.width}
                        onChange={(e) => this.onChangeWidth(e)}
                    />
                </div>
                <div className="game-start">
                    <label>Height</label>
                    <input
                        name="height"
                        type="number"
                        value={this.state.height}
                        onChange={(e) => this.onChangeHeight(e)}
                    />
                </div>
                <div className="game-start">
                    <label>Mines</label>
                    <input
                        name="mines"
                        type="number"
                        value={this.state.totalMines}
                        onChange={(e) => this.onChangeMines(e)}
                    />
                </div>
                <div className="game-board">
                    <button
                        className="start-button"
                        onClick={() => this.startGame()}
                        >
                        Start Game
                    </button>
                </div>
                {this.renderModal()}
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
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error)
            }
            let tiles = Array(this.state.height * this.state.width).fill("?");
            this.setState({
                uuid: data.uuid,
                tiles: tiles,
            });
            this.intervalHandle = setInterval(this.tick, 1000);
        })
        .catch((error) => {
            this.openModal(error);
        });
    }

    tick() {
        this.setState({timer: this.state.timer + 1});
    }
}

ReactDOM.render(
    <Game />,
    document.getElementById('root')
);
