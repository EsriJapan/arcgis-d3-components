# Scatterplot by Time

![](http://apps.esrij.com/arcgis-dev/github/img/scatterplot-by-time.gif)

```js
require(["https://esrijapan.github.io/d3-components/src/scatterplot-by-time/chart.js"], function(ScatterplotByTime) {

  var chart = new ScatterplotByTime({
    map: map,
    layer: layer,
    dateField: "DATE",
    valueField: "MAGUNITUDE",
    dateLabel: "日時",
    valueLabel: "マグニチュード",
    timeExtent: timeExtent
  }, "chartView");
  chart.startup();

  ...

  function updateChartHighlight(timeExtent) {
    chart.setHightlightRange(timeExtent);
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

```html
<!-- CSS for chart -->
<link rel="stylesheet" href="https://esrijapan.github.io/d3-components/src/scatterplot-by-time/chart.css">
```
