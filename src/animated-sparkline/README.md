# Animated Sparkline

![](http://apps.esrij.com/arcgis-dev/github/img/animated-sparkline.gif)

```js
require(["https://esrijapan.github.io/d3-components/src/animated-sparkline/chart.js"], function(AnimatedSparkline) {

  var chart = new AnimatedSparkline({
    width: 300,
    height: 100,
    interpolation: "basis",
    animate: true,
    updateDelay: 280,
    transitionDelay: 280,
    minx: 0,
    maxx: 1000,
    range: 100,
    strokeColor: "#fff"
  }, "chartView");
  chart.startup();

  ...

  function updateSparkline(val) {
    chart.update(val);
  }

});
```

```html
<div class="chart-wrapper">
  <div class="chart">
    <div id="chartView"></div>
  </div>
</div>
```

```css
.chart-wrapper {
  height: 100%;
  width: 100%;
  border-left: 1px solid #fff;
  border-right: 1px solid #fff;;
  border-bottom: 1px solid #fff;
}
.chart {
  height: 100px;
  width: 100%;
  margin: 0 auto;
}
```
