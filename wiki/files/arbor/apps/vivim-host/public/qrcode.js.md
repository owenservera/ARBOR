# File: apps/vivim-host/public/qrcode.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/public/qrcode.js |
| Language | JavaScript |
| Kind | source |
| Size | 58991 B |
| Lines | 2297 |
| Hash | 4b6133cbb5a1 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| qrcode | function | 18 | no | var qrcode = function() { |
| qrcode | function | 29 | no | var qrcode = function(typeNumber, errorCorrectionLevel) { |
| PAD0 | variable | 31 | no | var PAD0 = 0xEC; |
| PAD1 | variable | 32 | no | var PAD1 = 0x11; |
| _typeNumber | variable | 34 | no | var _typeNumber = typeNumber; |
| _errorCorrectionLevel | variable | 35 | no | var _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel]; |
| _modules | variable | 36 | no | var _modules = null; |
| _moduleCount | variable | 37 | no | var _moduleCount = 0; |
| _dataCache | variable | 38 | no | var _dataCache = null; |
| _dataList | variable | 39 | no | var _dataList = []; |
| _this | variable | 41 | no | var _this = {}; |
| makeImpl | function | 43 | no | var makeImpl = function(test, maskPattern) { |
| modules | variable | 47 | no | var modules = new Array(moduleCount); |
| setupPositionProbePattern | function | 75 | no | var setupPositionProbePattern = function(row, col) { |
| getBestMaskPattern | function | 96 | no | var getBestMaskPattern = function() { |
| minLostPoint | variable | 98 | no | var minLostPoint = 0; |
| pattern | variable | 99 | no | var pattern = 0; |
| lostPoint | variable | 105 | no | var lostPoint = QRUtil.getLostPoint(_this); |
| setupTimingPattern | function | 116 | no | var setupTimingPattern = function() { |
| setupPositionAdjustPattern | function | 133 | no | var setupPositionAdjustPattern = function() { |
| pos | variable | 135 | no | var pos = QRUtil.getPatternPosition(_typeNumber); |
| row | variable | 141 | no | var row = pos[i]; |
| col | variable | 142 | no | var col = pos[j]; |
| setupTypeNumber | function | 164 | no | var setupTypeNumber = function(test) { |
| bits | variable | 166 | no | var bits = QRUtil.getBCHTypeNumber(_typeNumber); |
| mod | variable | 169 | no | var mod = (!test &amp;&amp; ( (bits &gt;&gt; i) &amp; 1) == 1); |
| mod | variable | 174 | no | var mod = (!test &amp;&amp; ( (bits &gt;&gt; i) &amp; 1) == 1); |
| setupTypeInfo | function | 179 | no | var setupTypeInfo = function(test, maskPattern) { |
| data | variable | 181 | no | var data = (_errorCorrectionLevel &lt;&lt; 3) \| maskPattern; |
| bits | variable | 182 | no | var bits = QRUtil.getBCHTypeInfo(data); |
| mod | variable | 187 | no | var mod = (!test &amp;&amp; ( (bits &gt;&gt; i) &amp; 1) == 1); |
| mod | variable | 201 | no | var mod = (!test &amp;&amp; ( (bits &gt;&gt; i) &amp; 1) == 1); |
| mapData | function | 216 | no | var mapData = function(data, maskPattern) { |
| inc | variable | 218 | no | var inc = -1; |
| row | variable | 219 | no | var row = _moduleCount - 1; |
| bitIndex | variable | 220 | no | var bitIndex = 7; |
| byteIndex | variable | 221 | no | var byteIndex = 0; |
| maskFunc | variable | 222 | no | var maskFunc = QRUtil.getMaskFunction(maskPattern); |
| dark | variable | 234 | no | var dark = false; |
| mask | variable | 240 | no | var mask = maskFunc(row, col - c); |
| createBytes | function | 267 | no | var createBytes = function(buffer, rsBlocks) { |
| offset | variable | 269 | no | var offset = 0; |
| maxDcCount | variable | 271 | no | var maxDcCount = 0; |
| maxEcCount | variable | 272 | no | var maxEcCount = 0; |
| dcdata | variable | 274 | no | var dcdata = new Array(rsBlocks.length); |
| ecdata | variable | 275 | no | var ecdata = new Array(rsBlocks.length); |
| dcCount | variable | 279 | no | var dcCount = rsBlocks[r].dataCount; |
| ecCount | variable | 280 | no | var ecCount = rsBlocks[r].totalCount - dcCount; |
| rsPoly | variable | 292 | no | var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount); |
| rawPoly | variable | 293 | no | var rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1); |
| modPoly | variable | 295 | no | var modPoly = rawPoly.mod(rsPoly); |
| modIndex | variable | 298 | no | var modIndex = i + modPoly.getLength() - ecdata[r].length; |
| totalCodeCount | variable | 303 | no | var totalCodeCount = 0; |
| data | variable | 308 | no | var data = new Array(totalCodeCount); |
| index | variable | 309 | no | var index = 0; |
| createData | function | 332 | no | var createData = function(typeNumber, errorCorrectionLevel, dataList) { |
| rsBlocks | variable | 334 | no | var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel); |
| buffer | variable | 336 | no | var buffer = qrBitBuffer(); |
| data | variable | 339 | no | var data = dataList[i]; |
| totalDataCount | variable | 346 | no | var totalDataCount = 0; |
| newData | variable | 390 | no | var newData = null; |
| typeNumber | variable | 426 | no | var typeNumber = 1; |
| rsBlocks | variable | 429 | no | var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, _errorCorrectionLevel); |
| buffer | variable | 430 | no | var buffer = qrBitBuffer(); |
| data | variable | 433 | no | var data = _dataList[i]; |
| totalDataCount | variable | 439 | no | var totalDataCount = 0; |
| qrHtml | variable | 460 | no | var qrHtml = &#39;&#39;; |
| opts | variable | 497 | no | var opts = {}; |
| size | variable | 521 | no | var size = _this.getModuleCount() * cellSize + margin * 2; |
| c | variable | 522 | no | var c, mc, r, mr, qrSvg=&#39;&#39;, rect; |
| size | variable | 562 | no | var size = _this.getModuleCount() * cellSize + margin * 2; |
| min | variable | 563 | no | var min = margin; |
| max | variable | 564 | no | var max = size - margin; |
| c | variable | 568 | no | var c = Math.floor( (x - min) / cellSize); |
| r | variable | 569 | no | var r = Math.floor( (y - min) / cellSize); |
| size | variable | 582 | no | var size = _this.getModuleCount() * cellSize + margin * 2; |
| img | variable | 584 | no | var img = &#39;&#39;; |
| escapeXml | function | 605 | no | var escapeXml = function(s) { |
| escaped | variable | 606 | no | var escaped = &#39;&#39;; |
| c | variable | 608 | no | var c = s.charAt(i); |
| _createHalfASCII | function | 620 | no | var _createHalfASCII = function(margin) { |
| cellSize | variable | 621 | no | var cellSize = 1; |
| size | variable | 624 | no | var size = _this.getModuleCount() * cellSize + margin * 2; |
| min | variable | 625 | no | var min = margin; |
| max | variable | 626 | no | var max = size - margin; |
| y | variable | 628 | no | var y, x, r1, r2, p; |
| blocks | variable | 630 | no | var blocks = { |
| blocksLastLineNoMargin | variable | 637 | no | var blocksLastLineNoMargin = { |
| ascii | variable | 644 | no | var ascii = &#39;&#39;; |
| size | variable | 686 | no | var size = _this.getModuleCount() * cellSize + margin * 2; |
| min | variable | 687 | no | var min = margin; |
| max | variable | 688 | no | var max = size - margin; |
| y | variable | 690 | no | var y, x, r, p; |
| white | variable | 692 | no | var white = Array(cellSize+1).join(&#39;██&#39;); |
| black | variable | 693 | no | var black = Array(cellSize+1).join(&#39; &#39;); |
| ascii | variable | 695 | no | var ascii = &#39;&#39;; |
| line | variable | 696 | no | var line = &#39;&#39;; |
| length | variable | 721 | no | var length = _this.getModuleCount(); |
| bytes | variable | 739 | no | var bytes = []; |
| c | variable | 741 | no | var c = s.charCodeAt(i); |
| unicodeMap | function | 763 | no | var unicodeMap = function() { |
| bin | variable | 765 | no | var bin = base64DecodeInputStream(unicodeData); |
| read | function | 766 | no | var read = function() { |
| b | variable | 767 | no | var b = bin.read(); |
| count | variable | 772 | no | var count = 0; |
| unicodeMap | variable | 773 | no | var unicodeMap = {}; |
| b0 | variable | 775 | no | var b0 = bin.read(); |
| b1 | variable | 777 | no | var b1 = read(); |
| b2 | variable | 778 | no | var b2 = read(); |
| b3 | variable | 779 | no | var b3 = read(); |
| k | variable | 780 | no | var k = String.fromCharCode( (b0 &lt;&lt; 8) \| b1); |
| v | variable | 781 | no | var v = (b2 &lt;&lt; 8) \| b3; |
| unknownChar | variable | 792 | no | var unknownChar = &#39;?&#39;.charCodeAt(0); |
| bytes | variable | 795 | no | var bytes = []; |
| c | variable | 797 | no | var c = s.charCodeAt(i); |
| b | variable | 801 | no | var b = unicodeMap[s.charAt(i)]; |
| QRMode | variable | 824 | no | var QRMode = { |
| QRErrorCorrectionLevel | variable | 835 | no | var QRErrorCorrectionLevel = { |
| QRMaskPattern | variable | 846 | no | var QRMaskPattern = { |
| QRUtil | function | 861 | no | var QRUtil = function() { |
| PATTERN_POSITION_TABLE | variable | 863 | no | var PATTERN_POSITION_TABLE = [ |
| G15 | variable | 905 | no | var G15 = (1 &lt;&lt; 10) \| (1 &lt;&lt; 8) \| (1 &lt;&lt; 5) \| (1 &lt;&lt; 4) \| (1 &lt;&lt; 2) \| (1 &lt;&lt; 1) \| (1 &lt;&lt; 0); |
| G18 | variable | 906 | no | var G18 = (1 &lt;&lt; 12) \| (1 &lt;&lt; 11) \| (1 &lt;&lt; 10) \| (1 &lt;&lt; 9) \| (1 &lt;&lt; 8) \| (1 &lt;&lt; 5) \| (1 &lt;&lt; 2) \| (1 &lt;&lt; 0); |
| G15_MASK | variable | 907 | no | var G15_MASK = (1 &lt;&lt; 14) \| (1 &lt;&lt; 12) \| (1 &lt;&lt; 10) \| (1 &lt;&lt; 4) \| (1 &lt;&lt; 1); |
| _this | variable | 909 | no | var _this = {}; |
| getBCHDigit | function | 911 | no | var getBCHDigit = function(data) { |
| digit | variable | 912 | no | var digit = 0; |
| d | variable | 921 | no | var d = data &lt;&lt; 10; |
| d | variable | 929 | no | var d = data &lt;&lt; 12; |
| a | variable | 967 | no | var a = qrPolynomial([1], 0); |
| moduleCount | variable | 1022 | no | var moduleCount = qrcode.getModuleCount(); |
| lostPoint | variable | 1024 | no | var lostPoint = 0; |
| sameCount | variable | 1031 | no | var sameCount = 0; |
| dark | variable | 1032 | no | var dark = qrcode.isDark(row, col); |
| count | variable | 1066 | no | var count = 0; |
| darkCount | variable | 1109 | no | var darkCount = 0; |
| ratio | variable | 1119 | no | var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5; |
| QRMath | function | 1132 | no | var QRMath = function() { |
| EXP_TABLE | variable | 1134 | no | var EXP_TABLE = new Array(256); |
| LOG_TABLE | variable | 1135 | no | var LOG_TABLE = new Array(256); |
| _this | variable | 1151 | no | var _this = {}; |
| qrPolynomial | function | 1182 | no | function qrPolynomial(num, shift) { |
| _num | function | 1188 | no | var _num = function() { |
| offset | variable | 1189 | no | var offset = 0; |
| _num | variable | 1193 | no | var _num = new Array(num.length - offset + shift); |
| _this | variable | 1200 | no | var _this = {}; |
| num | variable | 1212 | no | var num = new Array(_this.getLength() + e.getLength() - 1); |
| ratio | variable | 1229 | no | var ratio = QRMath.glog(_this.getAt(0) ) - QRMath.glog(e.getAt(0) ); |
| num | variable | 1231 | no | var num = new Array(_this.getLength() ); |
| QRRSBlock | function | 1251 | no | var QRRSBlock = function() { |
| RS_BLOCK_TABLE | variable | 1253 | no | var RS_BLOCK_TABLE = [ |
| qrRSBlock | function | 1501 | no | var qrRSBlock = function(totalCount, dataCount) { |
| _this | variable | 1502 | no | var _this = {}; |
| _this | variable | 1508 | no | var _this = {}; |
| getRsBlockTable | function | 1510 | no | var getRsBlockTable = function(typeNumber, errorCorrectionLevel) { |
| rsBlock | variable | 1528 | no | var rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel); |
| length | variable | 1535 | no | var length = rsBlock.length / 3; |
| list | variable | 1537 | no | var list = []; |
| count | variable | 1541 | no | var count = rsBlock[i * 3 + 0]; |
| totalCount | variable | 1542 | no | var totalCount = rsBlock[i * 3 + 1]; |
| dataCount | variable | 1543 | no | var dataCount = rsBlock[i * 3 + 2]; |
| qrBitBuffer | function | 1560 | no | var qrBitBuffer = function() { |
| _buffer | variable | 1562 | no | var _buffer = []; |
| _length | variable | 1563 | no | var _length = 0; |
| _this | variable | 1565 | no | var _this = {}; |
| bufIndex | variable | 1572 | no | var bufIndex = Math.floor(index / 8); |
| bufIndex | variable | 1588 | no | var bufIndex = Math.floor(_length / 8); |
| qrNumber | function | 1607 | no | var qrNumber = function(data) { |
| _mode | variable | 1609 | no | var _mode = QRMode.MODE_NUMBER; |
| _data | variable | 1610 | no | var _data = data; |
| _this | variable | 1612 | no | var _this = {}; |
| data | variable | 1624 | no | var data = _data; |
| i | variable | 1626 | no | var i = 0; |
| strToNum | function | 1642 | no | var strToNum = function(s) { |
| num | variable | 1643 | no | var num = 0; |
| chatToNum | function | 1650 | no | var chatToNum = function(c) { |
| qrAlphaNum | function | 1664 | no | var qrAlphaNum = function(data) { |
| _mode | variable | 1666 | no | var _mode = QRMode.MODE_ALPHA_NUM; |
| _data | variable | 1667 | no | var _data = data; |
| _this | variable | 1669 | no | var _this = {}; |
| s | variable | 1681 | no | var s = _data; |
| i | variable | 1683 | no | var i = 0; |
| getCode | function | 1697 | no | var getCode = function(c) { |
| qr8BitByte | function | 1727 | no | var qr8BitByte = function(data) { |
| _mode | variable | 1729 | no | var _mode = QRMode.MODE_8BIT_BYTE; |
| _data | variable | 1730 | no | var _data = data; |
| _bytes | variable | 1731 | no | var _bytes = qrcode.stringToBytes(data); |
| _this | variable | 1733 | no | var _this = {}; |
| qrKanji | function | 1756 | no | var qrKanji = function(data) { |
| _mode | variable | 1758 | no | var _mode = QRMode.MODE_KANJI; |
| _data | variable | 1759 | no | var _data = data; |
| stringToBytes | variable | 1761 | no | var stringToBytes = qrcode.stringToBytesFuncs[&#39;SJIS&#39;]; |
| test | variable | 1767 | no | var test = stringToBytes(c); |
| _bytes | variable | 1773 | no | var _bytes = stringToBytes(data); |
| _this | variable | 1775 | no | var _this = {}; |
| data | variable | 1787 | no | var data = _bytes; |
| i | variable | 1789 | no | var i = 0; |
| c | variable | 1793 | no | var c = ( (0xff &amp; data[i]) &lt;&lt; 8) \| (0xff &amp; data[i + 1]); |
| byteArrayOutputStream | function | 1826 | no | var byteArrayOutputStream = function() { |
| _bytes | variable | 1828 | no | var _bytes = []; |
| _this | variable | 1830 | no | var _this = {}; |
| s | variable | 1860 | no | var s = &#39;&#39;; |
| base64EncodeOutputStream | function | 1879 | no | var base64EncodeOutputStream = function() { |
| _buffer | variable | 1881 | no | var _buffer = 0; |
| _buflen | variable | 1882 | no | var _buflen = 0; |
| _length | variable | 1883 | no | var _length = 0; |
| _base64 | variable | 1884 | no | var _base64 = &#39;&#39;; |
| _this | variable | 1886 | no | var _this = {}; |
| writeEncoded | function | 1888 | no | var writeEncoded = function(b) { |
| encode | function | 1892 | no | var encode = function(n) { |
| padlen | variable | 1931 | no | var padlen = 3 - _length % 3; |
| base64DecodeInputStream | function | 1949 | no | var base64DecodeInputStream = function(str) { |
| _str | variable | 1951 | no | var _str = str; |
| _pos | variable | 1952 | no | var _pos = 0; |
| _buffer | variable | 1953 | no | var _buffer = 0; |
| _buflen | variable | 1954 | no | var _buflen = 0; |
| _this | variable | 1956 | no | var _this = {}; |
| c | variable | 1969 | no | var c = _str.charAt(_pos); |
| n | variable | 1984 | no | var n = (_buffer &gt;&gt;&gt; (_buflen - 8) ) &amp; 0xff; |
| decode | function | 1989 | no | var decode = function(c) { |
| gifImage | function | 2012 | no | var gifImage = function(width, height) { |
| _width | variable | 2014 | no | var _width = width; |
| _height | variable | 2015 | no | var _height = height; |
| _data | variable | 2016 | no | var _data = new Array(width * height); |
| _this | variable | 2018 | no | var _this = {}; |
| lzwMinCodeSize | variable | 2070 | no | var lzwMinCodeSize = 2; |
| raster | variable | 2071 | no | var raster = getLZWRaster(lzwMinCodeSize); |
| offset | variable | 2075 | no | var offset = 0; |
| bitOutputStream | function | 2092 | no | var bitOutputStream = function(out) { |
| _out | variable | 2094 | no | var _out = out; |
| _bitLength | variable | 2095 | no | var _bitLength = 0; |
| _bitBuffer | variable | 2096 | no | var _bitBuffer = 0; |
| _this | variable | 2098 | no | var _this = {}; |
| getLZWRaster | function | 2127 | no | var getLZWRaster = function(lzwMinCodeSize) { |
| clearCode | variable | 2129 | no | var clearCode = 1 &lt;&lt; lzwMinCodeSize; |
| endCode | variable | 2130 | no | var endCode = (1 &lt;&lt; lzwMinCodeSize) + 1; |
| bitLength | variable | 2131 | no | var bitLength = lzwMinCodeSize + 1; |
| table | variable | 2134 | no | var table = lzwTable(); |
| byteOut | variable | 2142 | no | var byteOut = byteArrayOutputStream(); |
| bitOut | variable | 2143 | no | var bitOut = bitOutputStream(byteOut); |
| dataIndex | variable | 2148 | no | var dataIndex = 0; |
| s | variable | 2150 | no | var s = String.fromCharCode(_data[dataIndex]); |
| c | variable | 2155 | no | var c = String.fromCharCode(_data[dataIndex]); |
| lzwTable | function | 2189 | no | var lzwTable = function() { |
| _map | variable | 2191 | no | var _map = {}; |
| _size | variable | 2192 | no | var _size = 0; |
| _this | variable | 2194 | no | var _this = {}; |
| createDataURL | function | 2222 | no | var createDataURL = function(width, height, getPixel) { |
| gif | variable | 2223 | no | var gif = gifImage(width, height); |
| b | variable | 2230 | no | var b = byteArrayOutputStream(); |
| base64 | variable | 2233 | no | var base64 = base64EncodeOutputStream(); |
| bytes | variable | 2234 | no | var bytes = b.toByteArray(); |
| toUTF8Array | function | 2254 | no | function toUTF8Array(str) { |
| utf8 | variable | 2255 | no | var utf8 = []; |
| charcode | variable | 2257 | no | var charcode = str.charCodeAt(i); |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
//---------------------------------------------------------------------
//
// QR Code Generator for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//
// The word 'QR Code' is registered trademark of
// DENSO WAVE INCORPORATED
//  http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------

var qrcode = function() {

  //---------------------------------------------------------------------
  // qrcode
  //---------------------------------------------------------------------

  /**
   * qrcode
   * @param typeNumber 1 to 40
   * @param errorCorrectionLevel 'L','M','Q','H'
   */
  var qrcode = function(typeNumber, errorCorrectionLevel) {

    var PAD0 = 0xEC;
    var PAD1 = 0x11;

    var _typeNumber = typeNumber;
    var _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
    var _modules = null;
    var _moduleCount = 0;
    var _dataCache = null;
    var _dataList = [];

    var _this = {};

    var makeImpl = function(test, maskPattern) {

      _moduleCount = _typeNumber * 4 + 17;
      _modules = function(moduleCount) {
        var modules = new Array(moduleCount);
        for (var row = 0; row < moduleCount; row += 1) {
          modules[row] = new Array(moduleCount);
          for (var col = 0; col < moduleCount; col += 1) {
            modules[row][col] = null;
          }
        }
        return modules;
      }(_moduleCount);

      setupPositionProbePattern(0, 0);
      setupPositionProbePattern(_moduleCount - 7, 0);
      setupPositionProbePattern(0, _moduleCount - 7);
      setupPositionAdjustPattern();
      setupTimingPattern();
      setupTypeInfo(test, maskPattern);

      if (_typeNumber >= 7) {
        setupTypeNumber(test);
      }

      if (_dataCache == null) {
        _dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList);
      }

      mapData(_dataCache, maskPattern);
    };

    var setupPositionProbePattern = function(row, col) {

      for (var r = -1; r <= 7; r += 1) {

        if (row + r <= -1 || _moduleCount <= row + r) continue;
```

_First 80 of 2298 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
