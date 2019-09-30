import React, {Component} from 'react';
import {Row, Col, Radio, Divider} from "antd";
import {SearchTree} from "./searchTree";
import {WordTree} from "./wordTree";
import {Wordcloudmask} from "./wordCloud";
import sentimentWords from './data/sentimentWords';
import wordTrees from './data/wordTrees';
import {positive, negative, positiveMask, negativeMask} from "./wordCloud";

const positiveWords = Array.prototype.concat(...sentimentWords.positive.map(x => x.children)).map(node => node.title);
const negativeWords = Array.prototype.concat(...sentimentWords.negative.map(x => x.children)).map(node => node.title);

export class Main extends Component {
    state = {
        selectedWord: null,
        selectedType: 'positive',
        orient: 'after',
    };

    wordTree = () => {
        if (!(this.state.selectedWord))
            return <div/>;
        const orient = this.state.orient === 'before' ? 'RL' : 'LR';
        return (
            <div className='center'>
                <h1>Word Tree for {this.state.selectedType} sentiment word {this.state.selectedWord}</h1>
                <Radio.Group buttonStyle="solid" size='large' onChange={e => this.setState({orient: e.target.value})}
                             value={this.state.orient}>
                    <Radio.Button value='before'>words before {this.state.selectedWord}</Radio.Button>
                    <Radio.Button value='after'>words after {this.state.selectedWord}</Radio.Button>
                </Radio.Group>
                <WordTree originData={wordTrees[this.state.selectedType][this.state.selectedWord][this.state.orient]}
                          orient={orient}/>
            </div>
        )
    };
    onWordSelect = (selectedWords) => {
        if (!selectedWords || selectedWords.length === 0)
            this.setState({selectedWord: null});
        else {
            const selectedWord = selectedWords[0];
            const selectedType = positiveWords.indexOf(selectedWord) > -1 ? 'positive' : negativeWords.indexOf(selectedWord) > -1 ? 'negative' : null;
            if (selectedType === null)
                this.setState({selectedWord: null, selectedType: null});
            else
                this.setState({selectedWord, selectedType});
        }
    };
    onChange = value => {
        if (!value)
            this.setState({selectedWord: null});
        else {
            const selectedWord = value;
            const selectedType = positiveWords.indexOf(selectedWord) > -1 ? 'positive' : negativeWords.indexOf(selectedWord) > -1 ? 'negative' : null;
            if (selectedType === null)
                this.setState({selectedWord: null, selectedType: null});
            else
                this.setState({selectedWord, selectedType});
        }
    };

    render() {
        return (
            <div>
                <div id='searchTree'>
                    <Row type="flex" justify="space-around">
                        {/*<Col span={8}><SearchTree data={sentimentWords.positive}*/}
                        {/*onSelect={this.onWordSelect.bind(this)}/></Col>*/}
                        {/*<Col span={8}><SearchTree data={sentimentWords.negative}*/}
                        {/*onSelect={this.onWordSelect.bind(this)}/></Col>*/}
                        <Col span={8} className='center'>
                            <Divider><h1>Positive Words</h1></Divider>
                            <SearchTree data={sentimentWords.positive} value={this.state.value}
                                        onChange={this.onChange.bind(this)} placeholder='Select a positive word'/>
                            <Wordcloudmask data={positive} img={positiveMask} shape='cloud'
                                           size={Math.floor(window.innerWidth / 3)}//550
                                           onChange={this.onChange.bind(this)}/>
                        </Col>
                        <Col span={8} className='center'>
                            <Divider><h1>Negative Words</h1></Divider>
                            <SearchTree data={sentimentWords.negative} value={this.state.value}
                                        onChange={this.onChange.bind(this)} placeholder='Select a negative word'/>
                            <Wordcloudmask data={negative} img={negativeMask} shape='cloud'
                                           size={Math.floor(window.innerWidth / 3)}
                                           onChange={this.onChange.bind(this)}/>
                        </Col>
                    </Row>
                </div>
                <div id='wordTree'>
                    {this.wordTree()}
                </div>
            </div>
        )
    }
}