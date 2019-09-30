import React, {Component} from 'react'
import ReactEcharts from 'echarts-for-react';

let node_id = 1;

function add_id(data, parent_id = null) {
    if (data.length !== undefined) {
        for (let i = 0; i < data.length; i++)
            add_id(data[i], parent_id);
        return;
    }
    if (!(data.id)) {
        data.id = node_id;
        data.parent_id = parent_id;
        node_id += 1;
    }
    if (data.children)
        add_id(data.children, data.id);

}

function dfs(node, callback, preCall = true) {
    if (preCall)
        callback(node);
    if (node.children)
        for (let i = 0; i < node.children.length; i++)
            dfs(node.children[i], callback, preCall);
    if (!preCall)
        callback(node);
}

export class WordTree extends Component {
    preProcess = (data, maxShowNum = 50) => {
        let id_to_node = {};
        add_id(data);
        dfs(data, (node) => {
            id_to_node[node.id] = node;
            const fontSize = Math.min(5 + 5 * Math.sqrt(node.freq), 30);
            let hasChild = true;
            if (!(node.children) || node.children.length === 0)
                hasChild = false;
            node.label = {
                show: true,
                fontSize: fontSize,
                fontWeight: hasChild ? 'bolder' : 'normal'
            };
        });
        dfs(data, (node) => {
            if (!(node.parent_id)) {
                node.path = [node.name];
                return;
            }
            node.path = id_to_node[node.parent_id].path.concat(node.name);
        }, true);
        let level = 0;
        // let totalNode = 0;
        let currentLevel = [data];
        let nextLevel = [];
        while (/*totalNode < maxShowNum &&*/ currentLevel.length > 0) {
            // totalNode += currentLevel.length;
            for (let i = 0; i < currentLevel.length; i++) {
                currentLevel[i].level = level;
                if (currentLevel[i].children)
                    nextLevel.push(...currentLevel[i].children);
            }
            currentLevel = nextLevel;
            nextLevel = [];
            level += 1;
        }
        const depth = Math.max(level - 1, 1);
        let space = 0;
        dfs(data, (node) => {
            if (!(node.level))
                return;
            if (node.level === depth || !(node.children) || node.children.length === 0)
                space = space + node.label.fontSize;
        });
        return {depth: Math.max(level - 1, 1), space: Math.max(space, 50)};
    };
    state = {data: this.props.originData, originData: this.props.originData};
    getOption = (data, depth) => {
        return {
            tooltip: {
                trigger: 'item',
                triggerOn: 'mousemove',
                textStyle: {
                    fontSize: 25,
                    lineHeight: 100
                }
            },
            series: [
                {
                    type: 'tree',
                    data: [data],
                    top: '1%',
                    left: '10%',
                    // left: this.props.orient === 'LR' ? '20%' : '30%',
                    bottom: '1%',
                    right: '10%',
                    // right: this.props.orient === 'LR' ? '30%' : '20%',
                    orient: this.props.orient,
                    // roam: true,
                    symbolSize: 7,
                    // width: 1024,
                    // height: 2024,
                    label: {
                        position: this.props.orient === 'LR' ? 'left' : 'right',
                        verticalAlign: 'middle',
                        align: this.props.orient === 'LR' ? 'right' : 'left',
                        formatter: (params) => {
                            let words = params.data.name.split(' ');
                            if (words.length > 3) {
                                if (this.props.orient === 'LR')
                                    words = words.slice(0, 3).concat('...');
                                else
                                    words = ['...'].concat(words.slice(words.length - 3, words.length));
                            }
                            return words.join(' ');
                        }
                    },
                    tooltip: {
                        formatter: (params) => {
                            const freq = params.data.freq;
                            const content = this.props.orient === 'LR' ? params.data.path.join(' ') : [...params.data.path].reverse().join(' ');
                            return 'freq: ' + freq + ', ' + content;
                        },
                    },
                    leaves: {
                        label: {
                            position: this.props.orient === 'LR' ? 'right' : 'left',
                            verticalAlign: 'middle',
                            align: this.props.orient === 'LR' ? 'left' : 'right',
                        }
                    },
                    initialTreeDepth: depth,
                    expandAndCollapse: true,
                    animationDuration: 550,
                    animationDurationUpdate: 750
                }
            ]
        }
    };
    onClick = (params) => {
        console.log(params);
        let clicked_id = params.data.id;
        let newData = JSON.parse(JSON.stringify(this.props.originData)); //deep copy
        let id_to_node = {};
        dfs(newData, (node) => {
            id_to_node[node.id] = node;
        });
        let current_node = id_to_node[clicked_id];
        while (current_node.parent_id !== null) {
            let parent_node = id_to_node[current_node.parent_id];
            parent_node.children = [current_node];
            current_node = parent_node;
        }
        this.setState({data: newData});
    };

    static getDerivedStateFromProps(props, current_state) {
        if (current_state.originData !== props.originData)
            return {
                data: props.originData,
                originData: props.originData,
            };
        return null;
    }

    render() {
        let data = this.state.data;
        const depthAndSpace = this.preProcess(data, 50);
        const depth = depthAndSpace.depth;
        const height = 1.5 * depthAndSpace.space;
        // const height = data.children ? 50 * data.children.length : 50;
        // transformData(data, 0, null, height);
        let onEvents = {
            'click': this.onClick,
            'onchartclick': (a, b) => {
                console.log(a);
                console.log(b);
            }
        };
        return (
            <div>
                <ReactEcharts
                    option={this.getOption(data, depth)}
                    style={{height: height, width: '100%'}}
                    onEvents={onEvents}/>
            </div>
        )
    }
}
