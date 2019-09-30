import React from "react";
import _ from 'lodash';
import {Chart, Geom, Tooltip, Coord, Shape} from "bizcharts";
import DataSet from "@antv/data-set";
import SentimentWords from './data/sentimentWords';

export const positive = Array.prototype.concat(...SentimentWords.positive.map(x => x.children));
export const negative = Array.prototype.concat(...SentimentWords.negative.map(x => x.children));
const publicUrl = process.env.PUBLIC_URL;
export const positiveMask = publicUrl + '/img/positive.bk.jpg';
export const negativeMask = publicUrl + '/img/negative.bk.jpg';

function getTextAttrs(cfg) {
    return _.assign(
        {},
        cfg.style,
        {
            fillOpacity: cfg.opacity,
            fontSize: cfg.origin._origin.size,
            rotate: cfg.origin._origin.rotate,
            text: cfg.origin._origin.text,
            textAlign: "center",
            fontFamily: cfg.origin._origin.font,
            fill: cfg.color,
            textBaseline: "Alphabetic"
        }
    );
}

// 给point注册一个词云的shape
Shape.registerShape("point", "cloud", {
    drawShape(cfg, container) {
        const attrs = getTextAttrs(cfg);
        return container.addShape("text", {
            attrs: _.assign(attrs, {
                x: cfg.x,
                y: cfg.y
            })
        });
    }
});

export class Wordcloudmask extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dv: null
        };
    }

    componentDidMount() {
        const dv = new DataSet.View().source(this.props.data);
        const range = dv.range("freq");
        const min = range[0];
        const max = range[1];
        const imageMask = new Image();
        imageMask.crossOrigin = "./";
        imageMask.src = this.props.img;
        // "https://img.alicdn.com/tfs/TB1VAglldfJ8KJjy0FeXXXKEXXa-2333-1200.png";

        imageMask.onload = () => {
            dv.transform({
                type: "tag-cloud",
                fields: ["title", "freq"],
                imageMask,
                font: "Verdana",
                size: [this.props.size, this.props.size],
                // 宽高设置最好根据 imageMask 做调整
                padding: 0,
                timeInterval: 5000,

                //max execute time
                rotate() {
                    // let random = Math.random();
                    // return (random-0.5) * 180;
                    let random = ~~(Math.random() * 4) % 4;

                    if (random === 2) {
                        random = 0;
                    }

                    return random * 90; // 0, 90, 270
                },

                fontSize(d) {
                    const divisor = (max - min) !== 0 ? (max - min) : 1;
                    return ((d.value - min) / divisor) * (32 - 8) + 8;
                    // const divisor = (max - min) !== 0 ? (max - min) : 1;
                    // return ((d.value - min) / divisor) * (50 - 10) + 15;
                }
            });
            this.setState({
                dv
            })
        };
    }

    render() {
        const {dv} = this.state;
        const scale = {
            x: {
                nice: true//false
            },
            y: {
                nice: true//false
            }
        };
        if (!dv) return null;
        return <div>
            <Chart
                width={this.props.size}
                height={this.props.size}
                data={dv}
                scale={scale}
                padding={0}
                onPointClick={(d) => this.props.onChange(d.data._origin.title)}
                //forceFit
            >
                <Tooltip showTitle={false}/>
                <Coord reflect="y"/>
                <Geom type="point" position="x*y" color="text" shape={this.props.shape} tooltip='freq'/>
                {/*<Geom type="point" position="x*y" color="black" shape={this.props.shape} tooltip='freq'/>*/}
            </Chart>
        </div>;
    }
}

Wordcloudmask.defaultProps = {data: positive, img: positiveMask, size: window.innerWidth / 3, shape: 'cloud'};