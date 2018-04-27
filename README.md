[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/LostInBrittany/granite-timeline)

# granite-timeline

A timeline rendering element using d3 and d3-timeline plugin

> Based on Polymer 2.x.



## Doc & demo

[https://lostinbrittany.github.io/granite-timeline](https://lostinbrittany.github.io/granite-timeline)


## Usage

<!---
```
<custom-element-demo>
  <template>
    <script src="../webcomponentsjs/webcomponents-lite.js"></script>
    <link rel="import" href="granite-timeline.html">
    <next-code-block></next-code-block>
  </template>
</custom-element-demo>
```
-->
```html
<granite-timeline 
    data='[{"times":[{"starting_time":1355752800000,"ending_time":1355759900000}, {"starting_time":1355767900000,"ending_time":1355774400000}]},{"times":[{"starting_time":1355759910000,"ending_time":1355761900000}]},{"times":[{"starting_time":1355761910000,"ending_time":1355763910000}]}]'          
    debug></granite-timeline>
```

## Install

Install the component using [Bower](http://bower.io/):

```sh
$ bower install LostInBrittany/granite-timeline --save
```

Or [download as ZIP](https://github.com/LostInBrittany/granite-timeline/archive/gh-pages.zip).

## Usage

1. Import Web Components' polyfill (if needed):

    ```html
    <script src="bower_components/webcomponentsjs/webcomponents.min.js"></script>
    ```

2. Import Custom Element:

    ```html
    <link rel="import" href="bower_components/granite-timeline/granite-timeline.html">
    ```

3. Start using it!

    ```html
    <granite-timeline data="{{data}}" axis="{{axis}}"></granite-timeline>
    ```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

[MIT License](http://opensource.org/licenses/MIT)