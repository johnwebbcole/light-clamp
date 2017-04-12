// title      : lightClamp
// author     : John Cole
// license    : ISC License
// file       : lightClamp.jscad

/* exported main, getParameterDefinitions */
/* global Hardware, ImperialBolts */

function getParameterDefinitions() {
  var parts = {
    body: 'body',
    clamp: 'clamp',
    assembled: 'assembled',
    exploded: 'exploded'
  };
  return [
    {
      name: 'resolution',
      type: 'choice',
      values: [0, 1, 2, 3, 4],
      captions: ['very low (6,16)', 'low (8,24)', 'normal (12,32)', 'high (24,64)', 'very high (48,128)'],
      initial: 2,
      caption: 'Resolution:'
    },
    {
      name: 'part',
      type: 'choice',
      values: Object.keys(parts),
      captions: Object.keys(parts).map(function(key) {
        return parts[key];
      }),
      initial: 'exploded',
      caption: 'Part:'
    }
  ];
}

function main(params) {
  var resolutions = [[6, 16], [8, 24], [12, 32], [24, 64], [48, 128]];
  CSG.defaultResolution3D = resolutions[params.resolution][0];
  CSG.defaultResolution2D = resolutions[params.resolution][1];
  util.init(CSG);

  var body = Parts.RoundedCube(38, 25, 100, 2).chamfer(2, 'z+').Center();
  var bolt = Hardware.Bolt(25, ImperialBolts['1/4 socket']).translate([0, 0, -7]);

  var nut = Hardware.Nut(ImperialNuts['1/4 hex'], 'loose').stretch('x', 20).translate([0, 0, 2]).color('red');

  var light = util.group();
  light.add(Parts.Cylinder(27.7, 55).color('gray'), 'body');
  light.add(Parts.Cylinder(33, 35).snap(light.parts.body, 'z', 'outside-').color('gray'), 'head');

  light.rotate(light.parts.body, 'x', 90).snap('body', body, 'z', 'inside+').translate([0, 0, -5]);

  var b2 = body.bisect('x');
  var b3 = b2.parts.positive.bisect('z');

  var clampbolt = Hardware.Bolt(util.inch(2), ImperialBolts['1/4 hex'], 'loose')
    .rotate(body, 'y', 90)
    .align('thread', body, 'y')
    .snap('head', body, 'x', 'inside-')
    .snap('thread', b3.parts.positive, 'z', 'inside-')
    .translate([0, 0, 5]);

  var parts = {
    assembled: function() {
      return [
        parts.body(), 
        parts.clamp().translate([1,0,0]), 
        light.combine(),
        clampbolt.combine('head,thread')
      ];
    },
    
    exploded: function() {
      return [
        parts.body().rotateY(-90).Center().Zero().translate([0, -15, 0]), 
        parts.clamp().rotateY(90).Center().Zero().translate([0, 15, 0])
      ];
    },

    body: function() {
      return union([b2.parts.negative, b3.parts.negative])
        .color('blue')
        .subtract([bolt.combine('tap'), nut, light.combine('body').enlarge(1, 1, 1), clampbolt.combine('tap')]);
    },

    clamp: function() {
      return b3.parts.positive.subtract([clampbolt.combine('tap'), light.combine('body').enlarge(1, 1, 1)]);
    }
  };

  return parts[params.part]();
}

// ********************************************************
// Other jscad libraries are injected here.  Do not remove.
// Install jscad libraries using NPM
// ********************************************************
// include:js
// endinject
