import React, {Component} from 'react';
import {Tree, Input} from 'antd';

const {TreeNode} = Tree;
const {Search} = Input;


const getParentKey = (key, tree) => {
    let parentKey;
    for (let i = 0; i < tree.length; i++) {
        const node = tree[i];
        if (node.children) {
            if (node.children.some(item => item.key === key)) {
                parentKey = node.key;
            } else if (getParentKey(key, node.children)) {
                parentKey = getParentKey(key, node.children);
            }
        }
    }
    return parentKey;
};
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
    state = {
        expandedKeys: [],
        searchValue: '',
        autoExpandParent: true,
    };

    onExpand = expandedKeys => {
        this.setState({
            expandedKeys,
            autoExpandParent: false,
        });
    };

    onChange = e => {
        const {value} = e.target;
        let expandedKeys = [];
        dfs(this.props.data, (item) => {
            if (item.title.indexOf(value) > -1)
                expandedKeys.push(getParentKey(item.key, this.props.data));
        });
        expandedKeys = expandedKeys.filter((item, i, self) => item && self.indexOf(item) === i);
        this.setState({
            expandedKeys,
            searchValue: value,
            autoExpandParent: true,
        });
    };
    containSearchValue = (node, searchValue, field = 'title') => {
        if (!searchValue || searchValue === '')
            return true;
        if (node[field].indexOf(searchValue) > -1)
            return true;
        if (node.children) {
            for (let i = 0; i < node.children.length; i++)
                if (this.containSearchValue(node.children[i], searchValue, field))
                    return true;
        }
        return false;
    };

    render() {
        const {searchValue, expandedKeys, autoExpandParent} = this.state;
        const loop = data =>
            data.map(item => {
                const index = item.title.indexOf(searchValue);
                const beforeStr = item.title.substr(0, index);
                const afterStr = item.title.substr(index + searchValue.length);
                const title =
                    index > -1 ? (
                        <span>
                            {beforeStr}
                            <span style={{color: '#f50'}}>{searchValue}</span>
                            {afterStr}
                        </span>
                    ) : (
                        <span>{item.title}</span>
                    );
                const isShow = this.containSearchValue(item, searchValue, 'title');
                if (item.children) {
                    return (
                        <TreeNode className={isShow ? '' : 'hidden'} key={item.key} title={title}>
                            {loop(item.children)}
                        </TreeNode>
                    );
                }
                return <TreeNode className={isShow ? '' : 'hidden'} key={item.key} title={title}/>;
            });
        return (
            <div>
                <Search style={{marginBottom: 8}} placeholder="Search" onChange={this.onChange}/>
                <Tree
                    onExpand={this.onExpand}
                    expandedKeys={expandedKeys}
                    autoExpandParent={autoExpandParent}
                    onSelect={this.props.onSelect}
                >
                    {loop(this.props.data)}
                </Tree>
            </div>
        );
    }
}