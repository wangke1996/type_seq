import React, {Component} from 'react';
import {TreeSelect} from 'antd';

const dfs = (node, callback, precall = true) => {
    if (node.length !== undefined) {
        for (let i = 0; i < node.length; i++)
            dfs(node[i], callback, precall);
        return;
    }
    if (precall)
        callback(node);
    if (node.children)
        dfs(node.children, callback, precall);
    if (!precall)
        callback(node);
};

export class SearchTree extends Component {

    render() {
        let data = JSON.parse(JSON.stringify(this.props.data)); //deep copy
        dfs(data, (node) => {
            node.value = node.title
        });
        return (
            <TreeSelect
                showSearch
                style={{width: 300}}
                size='large'
                value={this.props.value}
                dropdownStyle={{maxHeight: 400, overflow: 'auto'}}
                treeData={data}
                placeholder={this.props.placeholder}
                onChange={this.props.onChange}
            />
        );
    }

}