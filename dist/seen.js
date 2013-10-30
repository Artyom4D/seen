(function() {
  var ARRAY_POOL, Ambient, DiffusePhong, Flat, ICOSAHEDRON_COORDINATE_MAP, ICOSAHEDRON_POINTS, ICOS_X, ICOS_Z, IDENTITY, NEXT_UNIQUE_ID, POINT_POOL, PathPainter, Phong, TextPainter, seen, _line, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _styleElement, _svg,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    _this = this;

  seen = (typeof exports !== "undefined" && exports !== null ? exports : this).seen = {};

  NEXT_UNIQUE_ID = 1;

  seen.Util = {
    defaults: function(obj, opts, defaults) {
      var prop, _results;
      for (prop in opts) {
        if (obj[prop] == null) {
          obj[prop] = opts[prop];
        }
      }
      _results = [];
      for (prop in defaults) {
        if (obj[prop] == null) {
          _results.push(obj[prop] = defaults[prop]);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    },
    arraysEqual: function(a, b) {
      var i, val, _i, _len;
      if (!a.length === b.length) {
        return false;
      }
      for (i = _i = 0, _len = a.length; _i < _len; i = ++_i) {
        val = a[i];
        if (!(val === b[i])) {
          return false;
        }
      }
      return true;
    },
    uniqueId: function(prefix) {
      if (prefix == null) {
        prefix = '';
      }
      return prefix + NEXT_UNIQUE_ID++;
    }
  };

  seen.Events = {
    dispatch: function() {
      var arg, dispatch, _i, _len;
      dispatch = new seen.Events.Dispatcher();
      for (_i = 0, _len = arguments.length; _i < _len; _i++) {
        arg = arguments[_i];
        dispatch[arg] = seen.Events.Event();
      }
      return dispatch;
    }
  };

  seen.Events.Dispatcher = (function() {
    function Dispatcher() {
      this.on = __bind(this.on, this);
    }

    Dispatcher.prototype.on = function(type, listener) {
      var i, name;
      i = type.indexOf('.');
      name = '';
      if (i > 0) {
        name = type.substring(i + 1);
        type = type.substring(0, i);
      }
      if (this[type] != null) {
        this[type].on(name, listener);
      }
      return this;
    };

    return Dispatcher;

  })();

  seen.Events.Event = function() {
    var event, listenerMap, listeners;
    listeners = [];
    listenerMap = {};
    event = function() {
      var l, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = listeners.length; _i < _len; _i++) {
        l = listeners[_i];
        _results.push(l.apply(this, arguments));
      }
      return _results;
    };
    event.on = function(name, listener) {
      var existing, i;
      existing = listenerMap[name];
      if (existing) {
        listeners = listeners.slice(0, i = listeners.indexOf(existing)).concat(listeners.slice(i + 1));
        delete listenerMap[name];
      }
      if (listener) {
        listeners.push(listener);
        return listenerMap[name] = listener;
      }
    };
    return event;
  };

  ARRAY_POOL = new Array(16);

  IDENTITY = [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0];

  seen.Matrix = (function() {
    function Matrix(m) {
      this.m = m != null ? m : null;
      if (this.m == null) {
        this.m = IDENTITY.slice();
      }
      return this;
    }

    Matrix.prototype.copy = function() {
      return new seen.Matrix(this.m.slice());
    };

    Matrix.prototype.reset = function() {
      this.m = IDENTITY.slice();
      return this;
    };

    Matrix.prototype.multiply = function(b) {
      return this.matrix(b.m);
    };

    Matrix.prototype.matrix = function(m) {
      var c, i, j, _i, _j;
      c = ARRAY_POOL;
      for (j = _i = 0; _i < 4; j = ++_i) {
        for (i = _j = 0; _j < 16; i = _j += 4) {
          c[i + j] = m[i] * this.m[j] + m[i + 1] * this.m[4 + j] + m[i + 2] * this.m[8 + j] + m[i + 3] * this.m[12 + j];
        }
      }
      ARRAY_POOL = this.m;
      this.m = c;
      return this;
    };

    Matrix.prototype.rotx = function(theta) {
      var ct, rm, st;
      ct = Math.cos(theta);
      st = Math.sin(theta);
      rm = [1, 0, 0, 0, 0, ct, -st, 0, 0, st, ct, 0, 0, 0, 0, 1];
      return this.matrix(rm);
    };

    Matrix.prototype.roty = function(theta) {
      var ct, rm, st;
      ct = Math.cos(theta);
      st = Math.sin(theta);
      rm = [ct, 0, st, 0, 0, 1, 0, 0, -st, 0, ct, 0, 0, 0, 0, 1];
      return this.matrix(rm);
    };

    Matrix.prototype.rotz = function(theta) {
      var ct, rm, st;
      ct = Math.cos(theta);
      st = Math.sin(theta);
      rm = [ct, -st, 0, 0, st, ct, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
      return this.matrix(rm);
    };

    Matrix.prototype.translate = function(x, y, z) {
      if (x == null) {
        x = 0;
      }
      if (y == null) {
        y = 0;
      }
      if (z == null) {
        z = 0;
      }
      this.m[3] += x;
      this.m[7] += y;
      this.m[11] += z;
      return this;
    };

    Matrix.prototype.scale = function(sx, sy, sz) {
      if (sx == null) {
        sx = 1;
      }
      if (sy == null) {
        sy = sx;
      }
      if (sz == null) {
        sz = sy;
      }
      this.m[0] *= sx;
      this.m[5] *= sy;
      this.m[10] *= sz;
      return this;
    };

    return Matrix;

  })();

  seen.M = function(m) {
    return new seen.Matrix(m);
  };

  seen.Matrices = {
    identity: function() {
      return seen.M();
    },
    flipX: function() {
      return seen.M().scale(-1, 1, 1);
    },
    flipY: function() {
      return seen.M().scale(1, -1, 1);
    },
    flipZ: function() {
      return seen.M().scale(1, 1, -1);
    }
  };

  seen.Transformable = (function() {
    function Transformable() {
      var method, _fn, _i, _len, _ref,
        _this = this;
      this.m = new seen.Matrix();
      _ref = ['scale', 'translate', 'rotx', 'roty', 'rotz', 'matrix', 'reset'];
      _fn = function(method) {
        return _this[method] = function() {
          var _ref1;
          (_ref1 = this.m[method]).call.apply(_ref1, [this.m].concat(__slice.call(arguments)));
          return this;
        };
      };
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        method = _ref[_i];
        _fn(method);
      }
    }

    Transformable.prototype.transform = function(m) {
      this.m.multiply(m);
      return this;
    };

    return Transformable;

  })();

  seen.Point = (function() {
    function Point(x, y, z, w) {
      this.x = x != null ? x : 0;
      this.y = y != null ? y : 0;
      this.z = z != null ? z : 0;
      this.w = w != null ? w : 1;
    }

    Point.prototype.copy = function() {
      return new seen.Point(this.x, this.y, this.z, this.w);
    };

    Point.prototype.set = function(p) {
      this.x = p.x;
      this.y = p.y;
      this.z = p.z;
      this.w = p.w;
      return this;
    };

    Point.prototype.add = function(q) {
      this.x += q.x;
      this.y += q.y;
      this.z += q.z;
      return this;
    };

    Point.prototype.subtract = function(q) {
      this.x -= q.x;
      this.y -= q.y;
      this.z -= q.z;
      return this;
    };

    Point.prototype.translate = function(x, y, z) {
      this.x += x;
      this.y += y;
      this.z += z;
      return this;
    };

    Point.prototype.multiply = function(n) {
      this.x *= n;
      this.y *= n;
      this.z *= n;
      return this;
    };

    Point.prototype.divide = function(n) {
      this.x /= n;
      this.y /= n;
      this.z /= n;
      return this;
    };

    Point.prototype.normalize = function() {
      var n;
      n = Math.sqrt(this.dot(this));
      if (n === 0) {
        this.set(seen.Points.Z);
      } else {
        this.divide(n);
      }
      return this;
    };

    Point.prototype.transform = function(matrix) {
      var r;
      r = POINT_POOL;
      r.x = this.x * matrix.m[0] + this.y * matrix.m[1] + this.z * matrix.m[2] + this.w * matrix.m[3];
      r.y = this.x * matrix.m[4] + this.y * matrix.m[5] + this.z * matrix.m[6] + this.w * matrix.m[7];
      r.z = this.x * matrix.m[8] + this.y * matrix.m[9] + this.z * matrix.m[10] + this.w * matrix.m[11];
      r.w = this.x * matrix.m[12] + this.y * matrix.m[13] + this.z * matrix.m[14] + this.w * matrix.m[15];
      this.set(r);
      return this;
    };

    Point.prototype.dot = function(q) {
      return this.x * q.x + this.y * q.y + this.z * q.z;
    };

    Point.prototype.cross = function(q) {
      var r;
      r = POINT_POOL;
      r.x = this.y * q.z - this.z * q.y;
      r.y = this.z * q.x - this.x * q.z;
      r.z = this.x * q.y - this.y * q.x;
      this.set(r);
      return this;
    };

    Point.prototype.toJSON = function() {
      return [this.x, this.y, this.z, this.w];
    };

    return Point;

  })();

  seen.P = function(x, y, z, w) {
    return new seen.Point(x, y, z, w);
  };

  POINT_POOL = seen.P();

  seen.Points = {
    X: seen.P(1, 0, 0),
    Y: seen.P(0, 1, 0),
    Z: seen.P(0, 0, 1),
    ZERO: seen.P(0, 0, 0)
  };

  seen.Color = (function() {
    function Color(r, g, b, a) {
      this.r = r != null ? r : 0;
      this.g = g != null ? g : 0;
      this.b = b != null ? b : 0;
      this.a = a != null ? a : 0xFF;
    }

    Color.prototype.copy = function() {
      return new seen.Color(this.r, this.g, this.b, this.a);
    };

    Color.prototype.scale = function(n) {
      this.r *= n;
      this.g *= n;
      this.b *= n;
      return this;
    };

    Color.prototype.offset = function(n) {
      this.r += n;
      this.g += n;
      this.b += n;
      return this;
    };

    Color.prototype.clamp = function(min, max) {
      if (min == null) {
        min = 0;
      }
      if (max == null) {
        max = 0xFF;
      }
      this.r = Math.min(max, Math.max(min, this.r));
      this.g = Math.min(max, Math.max(min, this.g));
      this.b = Math.min(max, Math.max(min, this.b));
      return this;
    };

    Color.prototype.addChannels = function(c) {
      this.r += c.r;
      this.g += c.g;
      this.b += c.b;
      return this;
    };

    Color.prototype.multiplyChannels = function(c) {
      this.r *= c.r;
      this.g *= c.g;
      this.b *= c.b;
      return this;
    };

    Color.prototype.hex = function() {
      var c;
      c = (this.r << 16 | this.g << 8 | this.b).toString(16);
      while (c.length < 6) {
        c = '0' + c;
      }
      return '#' + c;
    };

    Color.prototype.style = function() {
      return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
    };

    return Color;

  })();

  seen.Colors = {
    rgb: function(r, g, b, a) {
      if (a == null) {
        a = 255;
      }
      return new seen.Color(r, g, b, a);
    },
    hex: function(hex) {
      if (hex.charAt(0) === '#') {
        hex = hex.substring(1);
      }
      return new seen.Color(parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16));
    },
    hsl: function(h, s, l, a) {
      var b, g, hue2rgb, p, q, r;
      if (a == null) {
        a = 1;
      }
      r = g = b = 0;
      if (s === 0) {
        r = g = b = l;
      } else {
        hue2rgb = function(p, q, t) {
          if (t < 0) {
            t += 1;
          } else if (t > 1) {
            t -= 1;
          }
          if (t < 1 / 6) {
            return p + (q - p) * 6 * t;
          } else if (t < 1 / 2) {
            return q;
          } else if (t < 2 / 3) {
            return p + (q - p) * (2 / 3 - t) * 6;
          } else {
            return p;
          }
        };
        q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
      }
      return new seen.Color(r * 255, g * 255, b * 255, a * 255);
    },
    randomSurfaces: function(shape) {
      var surface, _i, _len, _ref, _results;
      _ref = shape.surfaces;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        surface = _ref[_i];
        _results.push(surface.fill = new seen.Material(seen.Colors.hsl(Math.random(), 0.5, 0.4)));
      }
      return _results;
    },
    randomShape: function(shape) {
      return shape.fill(new seen.Material(seen.Colors.hsl(Math.random(), 0.5, 0.4)));
    },
    black: function() {
      return this.hex('#000000');
    },
    white: function() {
      return this.hex('#FFFFFF');
    },
    gray: function() {
      return this.hex('#888888');
    }
  };

  seen.C = function(r, g, b, a) {
    return new seen.Color(r, g, b, a);
  };

  seen.Material = (function() {
    Material.prototype.defaults = {
      color: seen.Colors.gray(),
      metallic: false,
      specularColor: seen.Colors.white(),
      specularExponent: 8,
      shader: null
    };

    function Material(color, options) {
      this.color = color;
      if (options == null) {
        options = {};
      }
      seen.Util.defaults(this, options, this.defaults);
    }

    Material.prototype.render = function(lights, shader, renderData) {
      var color, renderShader, _ref;
      renderShader = (_ref = this.shader) != null ? _ref : shader;
      color = renderShader.shade(lights, renderData, this);
      color.a = this.color.a;
      return color;
    };

    return Material;

  })();

  seen.Light = (function(_super) {
    __extends(Light, _super);

    Light.prototype.defaults = {
      point: seen.P(),
      color: seen.Colors.white(),
      intensity: 0.01,
      normal: seen.P(1, -1, -1).normalize()
    };

    function Light(type, options) {
      this.type = type;
      Light.__super__.constructor.apply(this, arguments);
      seen.Util.defaults(this, options, this.defaults);
      this.id = 'l' + seen.Util.uniqueId();
    }

    Light.prototype.render = function() {
      return this.colorIntensity = this.color.copy().scale(this.intensity);
    };

    return Light;

  })(seen.Transformable);

  seen.Lights = {
    point: function(opts) {
      return new seen.Light('point', opts);
    },
    directional: function(opts) {
      return new seen.Light('directional', opts);
    },
    ambient: function(opts) {
      return new seen.Light('ambient', opts);
    }
  };

  seen.ShaderUtils = {
    applyDiffuse: function(c, light, lightNormal, surfaceNormal, material) {
      var dot;
      dot = lightNormal.dot(surfaceNormal);
      if (dot > 0) {
        return c.addChannels(light.colorIntensity.copy().scale(dot));
      }
    },
    applyDiffuseAndSpecular: function(c, light, lightNormal, surfaceNormal, material) {
      var dot, eyeNormal, reflectionNormal, specularIntensity;
      dot = lightNormal.dot(surfaceNormal);
      if (dot > 0) {
        c.addChannels(light.colorIntensity.copy().scale(dot));
        eyeNormal = seen.Points.Z;
        reflectionNormal = surfaceNormal.copy().multiply(dot * 2).subtract(lightNormal);
        specularIntensity = Math.pow(1 + reflectionNormal.dot(eyeNormal), material.specularExponent);
        return c.offset(specularIntensity * light.intensity);
      }
    },
    applyAmbient: function(c, light) {
      return c.addChannels(light.colorIntensity);
    }
  };

  seen.Shader = (function() {
    function Shader() {}

    Shader.prototype.shade = function(lights, renderModel, material) {};

    return Shader;

  })();

  Phong = (function(_super) {
    __extends(Phong, _super);

    function Phong() {
      _ref = Phong.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Phong.prototype.shade = function(lights, renderModel, material) {
      var c, light, lightNormal, _i, _len;
      c = new seen.Color();
      for (_i = 0, _len = lights.length; _i < _len; _i++) {
        light = lights[_i];
        switch (light.type) {
          case 'point':
            lightNormal = light.point.copy().subtract(renderModel.barycenter).normalize();
            seen.ShaderUtils.applyDiffuseAndSpecular(c, light, lightNormal, renderModel.normal, material);
            break;
          case 'directional':
            seen.ShaderUtils.applyDiffuseAndSpecular(c, light, light.normal, renderModel.normal, material);
            break;
          case 'ambient':
            seen.ShaderUtils.applyAmbient(c, light);
        }
      }
      c.multiplyChannels(material.color).clamp(0, 0xFF);
      return c;
    };

    return Phong;

  })(seen.Shader);

  DiffusePhong = (function(_super) {
    __extends(DiffusePhong, _super);

    function DiffusePhong() {
      _ref1 = DiffusePhong.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    DiffusePhong.prototype.shade = function(lights, renderModel, material) {
      var c, light, lightNormal, _i, _len;
      c = new seen.Color();
      for (_i = 0, _len = lights.length; _i < _len; _i++) {
        light = lights[_i];
        switch (light.type) {
          case 'point':
            lightNormal = light.point.copy().subtract(renderModel.barycenter).normalize();
            seen.ShaderUtils.applyDiffuse(c, light, lightNormal, renderModel.normal, material);
            break;
          case 'directional':
            seen.ShaderUtils.applyDiffuse(c, light, light.normal, renderModel.normal, material);
            break;
          case 'ambient':
            seen.ShaderUtils.applyAmbient(c, light);
        }
      }
      c.multiplyChannels(material.color).clamp(0, 0xFF);
      return c;
    };

    return DiffusePhong;

  })(seen.Shader);

  Ambient = (function(_super) {
    __extends(Ambient, _super);

    function Ambient() {
      _ref2 = Ambient.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    Ambient.prototype.shade = function(lights, renderModel, material) {
      var c, light, _i, _len;
      c = new seen.Color();
      for (_i = 0, _len = lights.length; _i < _len; _i++) {
        light = lights[_i];
        switch (light.type) {
          case 'ambient':
            seen.ShaderUtils.applyAmbient(c, light);
        }
      }
      c.multiplyChannels(material.color).clamp(0, 0xFF);
      return c;
    };

    return Ambient;

  })(seen.Shader);

  Flat = (function(_super) {
    __extends(Flat, _super);

    function Flat() {
      _ref3 = Flat.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    Flat.prototype.shade = function(lights, renderModel, material) {
      return material.color;
    };

    return Flat;

  })(seen.Shader);

  seen.Shaders = {
    phong: new Phong(),
    diffuse: new DiffusePhong(),
    ambient: new Ambient(),
    flat: new Flat()
  };

  seen.Renderer = (function() {
    function Renderer(scene) {
      this.scene = scene;
      this.render = __bind(this.render, this);
      this.layers = {};
      this.scene.on("render." + (seen.Util.uniqueId('renderer-')), this.render);
    }

    Renderer.prototype.render = function(renderModels) {
      var key, layer, _ref4;
      this.reset();
      _ref4 = this.layers;
      for (key in _ref4) {
        layer = _ref4[key];
        layer.render(renderModels);
      }
      return this.cleanup();
    };

    Renderer.prototype.reset = function() {};

    Renderer.prototype.cleanup = function() {};

    return Renderer;

  })();

  seen.RenderLayer = (function() {
    function RenderLayer() {
      this.render = __bind(this.render, this);
    }

    RenderLayer.prototype.render = function(renderModels) {
      var renderModel, _i, _len;
      this.reset();
      for (_i = 0, _len = renderModels.length; _i < _len; _i++) {
        renderModel = renderModels[_i];
        renderModel.surface.painter.paint(renderModel, this);
      }
      return this.cleanup();
    };

    RenderLayer.prototype.path = function() {};

    RenderLayer.prototype.text = function() {};

    RenderLayer.prototype.reset = function() {};

    RenderLayer.prototype.cleanup = function() {};

    return RenderLayer;

  })();

  seen.RenderModel = (function() {
    function RenderModel(surface, transform, projection) {
      this.surface = surface;
      this.transform = transform;
      this.projection = projection;
      this.points = this.surface.points;
      this.transformed = this._initRenderData();
      this.projected = this._initRenderData();
      this._update();
    }

    RenderModel.prototype.update = function(transform, projection) {
      if (seen.Util.arraysEqual(transform.m, this.transform.m) && seen.Util.arraysEqual(projection.m, this.projection.m)) {

      } else {
        this.transform = transform;
        this.projection = projection;
        return this._update();
      }
    };

    RenderModel.prototype._update = function() {
      this._math(this.transformed, this.points, this.transform, false);
      return this._math(this.projected, this.transformed.points, this.projection, true);
    };

    RenderModel.prototype._initRenderData = function() {
      var p;
      return {
        points: (function() {
          var _i, _len, _ref4, _results;
          _ref4 = this.points;
          _results = [];
          for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
            p = _ref4[_i];
            _results.push(p.copy());
          }
          return _results;
        }).call(this),
        barycenter: seen.P(),
        normal: seen.P(),
        v0: seen.P(),
        v1: seen.P()
      };
    };

    RenderModel.prototype._math = function(set, points, transform, applyClip) {
      var i, p, sp, _i, _j, _len, _len1, _ref4;
      if (applyClip == null) {
        applyClip = false;
      }
      for (i = _i = 0, _len = points.length; _i < _len; i = ++_i) {
        p = points[i];
        sp = set.points[i];
        sp.set(p).transform(transform);
        if (applyClip) {
          sp.divide(sp.w);
        }
      }
      set.barycenter.set(seen.Points.ZERO);
      _ref4 = set.points;
      for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
        p = _ref4[_j];
        set.barycenter.add(p);
      }
      set.barycenter.divide(set.points.length);
      set.v0.set(set.points[1]).subtract(set.points[0]);
      set.v1.set(set.points[points.length - 1]).subtract(set.points[0]);
      return set.normal.set(set.v0).cross(set.v1).normalize();
    };

    return RenderModel;

  })();

  seen.LightRenderModel = (function() {
    function LightRenderModel(light, transform) {
      var origin;
      this.colorIntensity = light.color.copy().scale(light.intensity);
      this.type = light.type;
      this.intensity = light.intensity;
      this.point = light.point.copy().transform(transform);
      origin = seen.Points.ZERO.copy().transform(transform);
      this.normal = light.normal.copy().transform(transform).subtract(origin).normalize();
    }

    return LightRenderModel;

  })();

  seen.Surface = (function() {
    Surface.prototype.cullBackfaces = true;

    Surface.prototype.fill = new seen.Material(seen.C.gray);

    Surface.prototype.stroke = null;

    function Surface(points, painter) {
      this.points = points;
      this.painter = painter != null ? painter : seen.Painters.path;
      this.id = 's' + seen.Util.uniqueId();
    }

    return Surface;

  })();

  seen.Shape = (function(_super) {
    __extends(Shape, _super);

    function Shape(type, surfaces) {
      this.type = type;
      this.surfaces = surfaces;
      Shape.__super__.constructor.call(this);
    }

    Shape.prototype.eachSurface = function(f) {
      this.surfaces.forEach(f);
      return this;
    };

    Shape.prototype.fill = function(fill) {
      this.eachSurface(function(s) {
        return s.fill = fill;
      });
      return this;
    };

    Shape.prototype.stroke = function(stroke) {
      this.eachSurface(function(s) {
        return s.stroke = stroke;
      });
      return this;
    };

    return Shape;

  })(seen.Transformable);

  seen.Model = (function(_super) {
    __extends(Model, _super);

    function Model() {
      Model.__super__.constructor.call(this);
      this.children = [];
      this.lights = [];
    }

    Model.prototype.add = function(child) {
      if (child instanceof seen.Shape || child instanceof seen.Model) {
        this.children.push(child);
      } else if (child instanceof seen.Light) {
        this.lights.push(child);
      }
      return this;
    };

    Model.prototype.append = function() {
      var model;
      model = new seen.Model;
      this.add(model);
      return model;
    };

    Model.prototype.eachShape = function(f) {
      var child, _i, _len, _ref4, _results;
      _ref4 = this.children;
      _results = [];
      for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
        child = _ref4[_i];
        if (child instanceof seen.Shape) {
          f.call(this, child);
        }
        if (child instanceof seen.Model) {
          _results.push(child.eachShape(f));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Model.prototype.eachRenderable = function(lightFn, shapeFn) {
      return this._eachRenderable(lightFn, shapeFn, [], this.m);
    };

    Model.prototype._eachRenderable = function(lightFn, shapeFn, lightModels, transform) {
      var child, light, _i, _j, _len, _len1, _ref4, _ref5, _results;
      if (this.lights.length > 0) {
        lightModels = lightModels.slice();
      }
      _ref4 = this.lights;
      for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
        light = _ref4[_i];
        lightModels.push(lightFn.call(this, light, light.m.copy().multiply(transform)));
      }
      _ref5 = this.children;
      _results = [];
      for (_j = 0, _len1 = _ref5.length; _j < _len1; _j++) {
        child = _ref5[_j];
        if (child instanceof seen.Shape) {
          shapeFn.call(this, child, lightModels, child.m.copy().multiply(transform));
        }
        if (child instanceof seen.Model) {
          _results.push(child._eachRenderable(lightFn, shapeFn, lightModels, child.m.copy().multiply(transform)));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return Model;

  })(seen.Transformable);

  seen.Models = {
    "default": function() {
      var model;
      model = new seen.Model();
      model.add(seen.Lights.directional({
        normal: seen.P(-1, 1, 1).normalize(),
        color: seen.Colors.hsl(0.1, 0.4, 0.7),
        intensity: 0.004
      }));
      model.add(seen.Lights.directional({
        normal: seen.P(1, 1, -1).normalize(),
        intensity: 0.003
      }));
      model.add(seen.Lights.ambient({
        intensity: 0.0015
      }));
      return model;
    }
  };

  seen.Painter = (function() {
    function Painter() {}

    Painter.prototype.paint = function(renderObject, canvas) {};

    return Painter;

  })();

  PathPainter = (function(_super) {
    __extends(PathPainter, _super);

    function PathPainter() {
      _ref4 = PathPainter.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    PathPainter.prototype.paint = function(renderObject, canvas) {
      var _ref5, _ref6;
      return canvas.path().style({
        fill: renderObject.fill == null ? 'none' : renderObject.fill.hex(),
        stroke: renderObject.stroke == null ? 'none' : renderObject.stroke.hex(),
        'fill-opacity': ((_ref5 = renderObject.fill) != null ? _ref5.a : void 0) == null ? 1.0 : renderObject.fill.a / 255.0,
        'stroke-width': (_ref6 = renderObject.surface['stroke-width']) != null ? _ref6 : 1
      }).path(renderObject.projected.points);
    };

    return PathPainter;

  })(seen.Painter);

  TextPainter = (function(_super) {
    __extends(TextPainter, _super);

    function TextPainter() {
      _ref5 = TextPainter.__super__.constructor.apply(this, arguments);
      return _ref5;
    }

    TextPainter.prototype.paint = function(renderObject, canvas) {
      var _ref6;
      return canvas.text().style({
        fill: renderObject.fill == null ? 'none' : renderObject.fill.hex(),
        stroke: renderObject.stroke == null ? 'none' : renderObject.stroke.hex(),
        'text-anchor': (_ref6 = renderObject.surface.anchor) != null ? _ref6 : 'middle'
      }).transform(renderObject.transform.copy().multiply(renderObject.projection)).text(renderObject.surface.text);
    };

    return TextPainter;

  })(seen.Painter);

  seen.Painters = {
    path: new PathPainter(),
    text: new TextPainter()
  };

  ICOS_X = 0.525731112119133606;

  ICOS_Z = 0.850650808352039932;

  ICOSAHEDRON_POINTS = [seen.P(-ICOS_X, 0.0, -ICOS_Z), seen.P(ICOS_X, 0.0, -ICOS_Z), seen.P(-ICOS_X, 0.0, ICOS_Z), seen.P(ICOS_X, 0.0, ICOS_Z), seen.P(0.0, ICOS_Z, -ICOS_X), seen.P(0.0, ICOS_Z, ICOS_X), seen.P(0.0, -ICOS_Z, -ICOS_X), seen.P(0.0, -ICOS_Z, ICOS_X), seen.P(ICOS_Z, ICOS_X, 0.0), seen.P(-ICOS_Z, ICOS_X, 0.0), seen.P(ICOS_Z, -ICOS_X, 0.0), seen.P(-ICOS_Z, -ICOS_X, 0.0)];

  ICOSAHEDRON_COORDINATE_MAP = [[0, 4, 1], [0, 9, 4], [9, 5, 4], [4, 5, 8], [4, 8, 1], [8, 10, 1], [8, 3, 10], [5, 3, 8], [5, 2, 3], [2, 7, 3], [7, 10, 3], [7, 6, 10], [7, 11, 6], [11, 0, 6], [0, 1, 6], [6, 1, 10], [9, 0, 11], [9, 11, 2], [9, 2, 5], [7, 2, 11]];

  seen.Shapes = {
    _cubeCoordinateMap: [[0, 1, 3, 2], [5, 4, 6, 7], [1, 0, 4, 5], [2, 3, 7, 6], [3, 1, 5, 7], [0, 2, 6, 4]],
    _mapPointsToSurfaces: function(points, coordinateMap) {
      var c, coords, spts, surfaces, _i, _len;
      surfaces = [];
      for (_i = 0, _len = coordinateMap.length; _i < _len; _i++) {
        coords = coordinateMap[_i];
        spts = (function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = coords.length; _j < _len1; _j++) {
            c = coords[_j];
            _results.push(points[c].copy());
          }
          return _results;
        })();
        surfaces.push(new seen.Surface(spts));
      }
      return surfaces;
    },
    _subdivideTriangles: function(triangles) {
      var newTriangles, tri, v01, v12, v20, _i, _len;
      newTriangles = [];
      for (_i = 0, _len = triangles.length; _i < _len; _i++) {
        tri = triangles[_i];
        v01 = tri[0].copy().add(tri[1]).normalize();
        v12 = tri[1].copy().add(tri[2]).normalize();
        v20 = tri[2].copy().add(tri[0]).normalize();
        newTriangles.push([tri[0], v01, v20]);
        newTriangles.push([tri[1], v12, v01]);
        newTriangles.push([tri[2], v20, v12]);
        newTriangles.push([v01, v12, v20]);
      }
      return newTriangles;
    },
    cube: function() {
      var points;
      points = [seen.P(-1, -1, -1), seen.P(-1, -1, 1), seen.P(-1, 1, -1), seen.P(-1, 1, 1), seen.P(1, -1, -1), seen.P(1, -1, 1), seen.P(1, 1, -1), seen.P(1, 1, 1)];
      return new seen.Shape('cube', seen.Shapes._mapPointsToSurfaces(points, seen.Shapes._cubeCoordinateMap));
    },
    unitcube: function() {
      var points;
      points = [seen.P(0, 0, 0), seen.P(0, 0, 1), seen.P(0, 1, 0), seen.P(0, 1, 1), seen.P(1, 0, 0), seen.P(1, 0, 1), seen.P(1, 1, 0), seen.P(1, 1, 1)];
      return new seen.Shape('unitcube', seen.Shapes._mapPointsToSurfaces(points, seen.Shapes._cubeCoordinateMap));
    },
    rectangle: function(point1, point2) {
      var compose, points;
      compose = function(x, y, z) {
        return seen.P(x(point1.x, point2.x), y(point1.y, point2.y), z(point1.z, point2.z));
      };
      points = [compose(Math.min, Math.min, Math.min), compose(Math.min, Math.min, Math.max), compose(Math.min, Math.max, Math.min), compose(Math.min, Math.max, Math.max), compose(Math.max, Math.min, Math.min), compose(Math.max, Math.min, Math.max), compose(Math.max, Math.max, Math.min), compose(Math.max, Math.max, Math.max)];
      return new seen.Shape('rect', seen.Shapes._mapPointsToSurfaces(points, seen.Shapes._cubeCoordinateMap));
    },
    tetrahedron: function() {
      var coordinateMap, points;
      points = [seen.P(1, 1, 1), seen.P(-1, -1, 1), seen.P(-1, 1, -1), seen.P(1, -1, -1)];
      coordinateMap = [[0, 2, 1], [0, 1, 3], [3, 2, 0], [1, 2, 3]];
      return new seen.Shape('tetrahedron', seen.Shapes._mapPointsToSurfaces(points, coordinateMap));
    },
    icosahedron: function() {
      return new seen.Shape('icosahedron', seen.Shapes._mapPointsToSurfaces(ICOSAHEDRON_POINTS, ICOSAHEDRON_COORDINATE_MAP));
    },
    sphere: function(subdivisions) {
      var i, triangles, _i;
      if (subdivisions == null) {
        subdivisions = 1;
      }
      triangles = ICOSAHEDRON_COORDINATE_MAP.map(function(coords) {
        return coords.map(function(c) {
          return ICOSAHEDRON_POINTS[c];
        });
      });
      for (i = _i = 0; 0 <= subdivisions ? _i < subdivisions : _i > subdivisions; i = 0 <= subdivisions ? ++_i : --_i) {
        triangles = seen.Shapes._subdivideTriangles(triangles);
      }
      return new seen.Shape('sphere', triangles.map(function(triangle) {
        return new seen.Surface(triangle.map(function(v) {
          return v.copy();
        }));
      }));
    },
    text: function(text) {
      var surface;
      surface = new seen.Surface([seen.P(0, 0, 0), seen.P(20, 0, 0), seen.P(0, 20, 0)], seen.Painters.text);
      surface.text = text;
      return new seen.Shape('text', [surface]);
    },
    extrude: function(points, distance) {
      var back, front, i, len, p, surfaces, _i, _ref6;
      if (distance == null) {
        distance = 1;
      }
      surfaces = [];
      front = new seen.Surface((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = points.length; _i < _len; _i++) {
          p = points[_i];
          _results.push(p.copy());
        }
        return _results;
      })());
      back = new seen.Surface((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = points.length; _i < _len; _i++) {
          p = points[_i];
          _results.push(p.translate(0, 0, distance));
        }
        return _results;
      })());
      for (i = _i = 1, _ref6 = points.length; 1 <= _ref6 ? _i < _ref6 : _i > _ref6; i = 1 <= _ref6 ? ++_i : --_i) {
        surfaces.push(new seen.Surface([front.points[i - 1].copy(), back.points[i - 1].copy(), back.points[i].copy(), front.points[i].copy()]));
      }
      len = points.length;
      surfaces.push(new seen.Surface([front.points[len - 1].copy(), back.points[len - 1].copy(), back.points[0].copy(), front.points[0].copy()]));
      back.points.reverse();
      surfaces.push(front);
      surfaces.push(back);
      return new seen.Shape('extrusion', surfaces);
    },
    arrow: function(thickness, tailLength, tailWidth, headLength, headPointiness) {
      var htw, points;
      if (thickness == null) {
        thickness = 1;
      }
      if (tailLength == null) {
        tailLength = 1;
      }
      if (tailWidth == null) {
        tailWidth = 1;
      }
      if (headLength == null) {
        headLength = 1;
      }
      if (headPointiness == null) {
        headPointiness = 0;
      }
      htw = tailWidth / 2;
      points = [seen.P(0, 0, 0), seen.P(headLength + headPointiness, 1, 0), seen.P(headLength, htw, 0), seen.P(headLength + tailLength, htw, 0), seen.P(headLength + tailLength, -htw, 0), seen.P(headLength, -htw, 0), seen.P(headLength + headPointiness, -1, 0)];
      return seen.Shapes.extrude(points, thickness);
    },
    path: function(points) {
      return new seen.Shape('path', [new seen.Surface(points)]);
    },
    custom: function(s) {
      var f, p, surfaces, _i, _len, _ref6;
      surfaces = [];
      _ref6 = s.surfaces;
      for (_i = 0, _len = _ref6.length; _i < _len; _i++) {
        f = _ref6[_i];
        surfaces.push(new seen.Surface((function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = f.length; _j < _len1; _j++) {
            p = f[_j];
            _results.push(seen.P.apply(seen, p));
          }
          return _results;
        })()));
      }
      return new seen.Shape('custom', surfaces);
    }
  };

  seen.Projections = {
    perspectiveFov: function(fovyInDegrees, front) {
      var tan;
      if (fovyInDegrees == null) {
        fovyInDegrees = 50;
      }
      if (front == null) {
        front = 1;
      }
      tan = front * Math.tan(fovyInDegrees * Math.PI / 360.0);
      return seen.Projections.perspective(-tan, tan, -tan, tan, front, 2 * front);
    },
    perspective: function(left, right, bottom, top, near, far) {
      var dx, dy, dz, m, near2;
      if (left == null) {
        left = -1;
      }
      if (right == null) {
        right = 1;
      }
      if (bottom == null) {
        bottom = -1;
      }
      if (top == null) {
        top = 1;
      }
      if (near == null) {
        near = 1;
      }
      if (far == null) {
        far = 100;
      }
      near2 = 2 * near;
      dx = right - left;
      dy = top - bottom;
      dz = far - near;
      m = new Array(16);
      m[0] = near2 / dx;
      m[1] = 0.0;
      m[2] = (right + left) / dx;
      m[3] = 0.0;
      m[4] = 0.0;
      m[5] = near2 / dy;
      m[6] = (top + bottom) / dy;
      m[7] = 0.0;
      m[8] = 0.0;
      m[9] = 0.0;
      m[10] = -(far + near) / dz;
      m[11] = -(far * near2) / dz;
      m[12] = 0.0;
      m[13] = 0.0;
      m[14] = -1.0;
      m[15] = 0.0;
      return seen.M(m);
    },
    ortho: function(left, right, bottom, top, near, far) {
      var dx, dy, dz, m, near2;
      if (left == null) {
        left = -1;
      }
      if (right == null) {
        right = 1;
      }
      if (bottom == null) {
        bottom = -1;
      }
      if (top == null) {
        top = 1;
      }
      if (near == null) {
        near = 1;
      }
      if (far == null) {
        far = 100;
      }
      near2 = 2 * near;
      dx = right - left;
      dy = top - bottom;
      dz = far - near;
      m = new Array(16);
      m[0] = 2 / dx;
      m[1] = 0.0;
      m[2] = 0.0;
      m[3] = (right + left) / dx;
      m[4] = 0.0;
      m[5] = 2 / dy;
      m[6] = 0.0;
      m[7] = -(top + bottom) / dy;
      m[8] = 0.0;
      m[9] = 0.0;
      m[10] = -2 / dz;
      m[11] = -(far + near) / dz;
      m[12] = 0.0;
      m[13] = 0.0;
      m[14] = 0.0;
      m[15] = 1.0;
      return seen.M(m);
    }
  };

  seen.Viewports = {
    center: function(width, height, x, y) {
      var postscale, prescale;
      if (width == null) {
        width = 500;
      }
      if (height == null) {
        height = 500;
      }
      if (x == null) {
        x = 0;
      }
      if (y == null) {
        y = 0;
      }
      prescale = seen.M().translate(-x, -y, -1).scale(1 / width, 1 / height, 1 / height);
      postscale = seen.M().scale(width, -height, height).translate(x + width / 2, y + height / 2);
      return {
        prescale: prescale,
        postscale: postscale
      };
    },
    origin: function(width, height, x, y) {
      var postscale, prescale;
      if (width == null) {
        width = 500;
      }
      if (height == null) {
        height = 500;
      }
      if (x == null) {
        x = 0;
      }
      if (y == null) {
        y = 0;
      }
      prescale = seen.M().translate(-x, -y, -1).scale(1 / width, 1 / height, 1 / height);
      postscale = seen.M().scale(width, -height, height).translate(x, y);
      return {
        prescale: prescale,
        postscale: postscale
      };
    }
  };

  seen.Camera = (function() {
    Camera.prototype.defaults = {
      projection: seen.Projections.perspective(),
      viewport: seen.Viewports.center(),
      camera: seen.Matrices.identity()
    };

    function Camera(options) {
      seen.Util.defaults(this, options, this.defaults);
    }

    Camera.prototype.getMatrix = function() {
      return this.camera.copy().multiply(this.viewport.prescale).multiply(this.projection).multiply(this.viewport.postscale);
    };

    return Camera;

  })();

  _svg = function(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
  };

  _line = function(points) {
    return 'M' + points.map(function(p) {
      return "" + p.x + " " + p.y;
    }).join('L');
  };

  _styleElement = function(el, style) {
    var key, str, val;
    str = '';
    for (key in style) {
      val = style[key];
      str += "" + key + ":" + val + ";";
    }
    return el.setAttribute('style', str);
  };

  seen.SvgPathPainter = (function() {
    function SvgPathPainter() {}

    SvgPathPainter.prototype.setElement = function(el) {
      this.el = el;
    };

    SvgPathPainter.prototype.style = function(style) {
      _styleElement(this.el, style);
      return this;
    };

    SvgPathPainter.prototype.path = function(points) {
      this.el.setAttribute('d', _line(points));
      return this;
    };

    return SvgPathPainter;

  })();

  seen.SvgTextPainter = (function() {
    function SvgTextPainter() {}

    SvgTextPainter.prototype.setElement = function(el) {
      this.el = el;
    };

    SvgTextPainter.prototype.style = function(style) {
      _styleElement(this.el, style);
      return this;
    };

    SvgTextPainter.prototype.transform = function(transform) {
      var m;
      m = seen.Matrices.flipY().multiply(transform).m;
      this.el.setAttribute('transform', "matrix(" + m[0] + " " + m[4] + " " + m[1] + " " + m[5] + " " + m[3] + " " + m[7] + ")");
      return this;
    };

    SvgTextPainter.prototype.text = function(text) {
      this.el.textContent = text;
      return this;
    };

    return SvgTextPainter;

  })();

  seen.SvgRenderer = (function(_super) {
    __extends(SvgRenderer, _super);

    function SvgRenderer() {
      this.pathPainter = new seen.SvgPathPainter();
      this.textPainter = new seen.SvgTextPainter();
    }

    SvgRenderer.prototype.setGroup = function(group) {
      this.group = group;
    };

    SvgRenderer.prototype.path = function() {
      var el;
      el = this._manifest('path');
      this.pathPainter.setElement(el);
      return this.pathPainter;
    };

    SvgRenderer.prototype.text = function() {
      var el;
      el = this._manifest('text');
      el.setAttribute('font-family', 'Roboto');
      this.textPainter.setElement(el);
      return this.textPainter;
    };

    SvgRenderer.prototype.reset = function() {
      return this._i = 0;
    };

    SvgRenderer.prototype.cleanup = function() {
      var children, _results;
      children = this.group.childNodes;
      _results = [];
      while (this._i < children.length) {
        children[this._i].setAttribute('style', 'display: none;');
        _results.push(this._i++);
      }
      return _results;
    };

    SvgRenderer.prototype._manifest = function(type) {
      var children, current, path;
      children = this.group.childNodes;
      if (this._i >= children.length) {
        path = _svg(type);
        this.group.appendChild(path);
        this._i++;
        return path;
      }
      current = children[this._i];
      if (current.tagName === type) {
        this._i++;
        return current;
      } else {
        path = _svg(type);
        this.group.replaceChild(path, current);
        this._i++;
        return path;
      }
    };

    return SvgRenderer;

  })(seen.RenderLayer);

  seen.SvgRenderDebug = (function(_super) {
    __extends(SvgRenderDebug, _super);

    function SvgRenderDebug(scene) {
      this._renderEnd = __bind(this._renderEnd, this);
      this._renderStart = __bind(this._renderStart, this);
      this._text = _svg('text');
      this._text.setAttribute('style', 'text-anchor:end;');
      this._text.setAttribute('x', 500 - 10);
      this._text.setAttribute('y', '20');
      this._fps = 30;
      scene.on('beforeRender.debug', this._renderStart);
      scene.on('afterRender.debug', this._renderEnd);
    }

    SvgRenderDebug.prototype.render = function() {};

    SvgRenderDebug.prototype.setGroup = function(group) {
      return group.appendChild(this._text);
    };

    SvgRenderDebug.prototype._renderStart = function() {
      return this._renderStartTime = new Date();
    };

    SvgRenderDebug.prototype._renderEnd = function(e) {
      var frameTime;
      frameTime = 1000 / (new Date() - this._renderStartTime);
      if (frameTime !== NaN) {
        this._fps += (frameTime - this._fps) / 20;
      }
      return this._text.textContent = "fps: " + (this._fps.toFixed(1)) + " surfaces: " + e.length;
    };

    return SvgRenderDebug;

  })(seen.RenderLayer);

  seen.SvgFillRect = (function(_super) {
    __extends(SvgFillRect, _super);

    function SvgFillRect(width, height) {
      this.width = width != null ? width : 500;
      this.height = height != null ? height : 500;
    }

    SvgFillRect.prototype.render = function() {};

    SvgFillRect.prototype.setGroup = function(group) {
      var rect;
      rect = _svg('rect');
      rect.setAttribute('fill', '#EEE');
      rect.setAttribute('width', this.width);
      rect.setAttribute('height', this.width);
      return group.appendChild(rect);
    };

    return SvgFillRect;

  })(seen.RenderLayer);

  seen.SvgCanvas = (function(_super) {
    __extends(SvgCanvas, _super);

    function SvgCanvas(scene, svg) {
      this.svg = svg;
      SvgCanvas.__super__.constructor.call(this, scene);
    }

    SvgCanvas.prototype.layer = function(name, component) {
      var group;
      this.layers[name] = component;
      this.svg.appendChild(group = _svg('g'));
      if (component != null) {
        component.setGroup(group);
      }
      return this;
    };

    return SvgCanvas;

  })(seen.Renderer);

  seen.SvgScene = function(elementId, scene, width, height) {
    if (width == null) {
      width = 400;
    }
    if (height == null) {
      height = 400;
    }
    return new seen.SvgCanvas(scene, document.getElementById(elementId)).layer('background', new seen.SvgFillRect(width, height)).layer('scene', new seen.SvgRenderer());
  };

  seen.CanvasPathPainter = (function() {
    function CanvasPathPainter() {}

    CanvasPathPainter.prototype.setContext = function(ctx) {
      this.ctx = ctx;
    };

    CanvasPathPainter.prototype.style = function(style) {
      var key, val;
      for (key in style) {
        val = style[key];
        switch (key) {
          case 'fill':
            this.ctx.fillStyle = val;
            break;
          case 'stroke':
            this.ctx.strokeStyle = val;
        }
      }
      return this;
    };

    CanvasPathPainter.prototype.path = function(points) {
      var i, p, _i, _len;
      this.ctx.beginPath();
      for (i = _i = 0, _len = points.length; _i < _len; i = ++_i) {
        p = points[i];
        if (i === 0) {
          this.ctx.moveTo(p.x, p.y);
        } else {
          this.ctx.lineTo(p.x, p.y);
        }
      }
      this.ctx.closePath();
      this.ctx.fill();
      return this;
    };

    return CanvasPathPainter;

  })();

  seen.CanvasTextPainter = (function() {
    function CanvasTextPainter() {}

    CanvasTextPainter.prototype.setContext = function(ctx) {
      this.ctx = ctx;
    };

    CanvasTextPainter.prototype.style = function(style) {
      var key, val;
      for (key in style) {
        val = style[key];
        switch (key) {
          case 'fill':
            this.ctx.fillStyle = val;
            break;
          case 'stroke':
            this.ctx.strokeStyle = val;
        }
      }
      this.ctx.font = '16px Roboto';
      return this;
    };

    CanvasTextPainter.prototype.text = function(text) {
      this.ctx.fillText(text, 0, 0);
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      return this;
    };

    CanvasTextPainter.prototype.transform = function(transform) {
      var m;
      m = seen.Matrices.flipY().multiply(transform).m;
      this.ctx.setTransform(m[0], m[4], m[1], m[5], m[3], m[7]);
      return this;
    };

    return CanvasTextPainter;

  })();

  seen.CanvasRenderer = (function(_super) {
    __extends(CanvasRenderer, _super);

    function CanvasRenderer(width, height) {
      this.width = width;
      this.height = height;
      this.pathPainter = new seen.CanvasPathPainter();
      this.textPainter = new seen.CanvasTextPainter();
    }

    CanvasRenderer.prototype.setContext = function(ctx) {
      this.ctx = ctx;
    };

    CanvasRenderer.prototype.path = function() {
      this.pathPainter.setContext(this.ctx);
      return this.pathPainter;
    };

    CanvasRenderer.prototype.text = function() {
      this.textPainter.setContext(this.ctx);
      return this.textPainter;
    };

    return CanvasRenderer;

  })(seen.RenderLayer);

  seen.CanvasFillRect = (function(_super) {
    __extends(CanvasFillRect, _super);

    function CanvasFillRect(width, height) {
      this.width = width != null ? width : 500;
      this.height = height != null ? height : 500;
      this.render = __bind(this.render, this);
    }

    CanvasFillRect.prototype.setContext = function(ctx) {
      this.ctx = ctx;
    };

    CanvasFillRect.prototype.render = function() {
      this.ctx.fillStyle = '#EEE';
      return this.ctx.fillRect(0, 0, this.width, this.height);
    };

    return CanvasFillRect;

  })(seen.RenderLayer);

  seen.CanvasCanvas = (function(_super) {
    __extends(CanvasCanvas, _super);

    function CanvasCanvas(scene, element) {
      this.element = element;
      CanvasCanvas.__super__.constructor.call(this, scene);
      this.ctx = this.element.getContext('2d');
    }

    CanvasCanvas.prototype.layer = function(name, component) {
      this.layers[name] = component;
      if (component != null) {
        component.setContext(this.ctx);
      }
      return this;
    };

    CanvasCanvas.prototype.reset = function() {
      return this.ctx.clearRect(0, 0, this.width, this.height);
    };

    return CanvasCanvas;

  })(seen.Renderer);

  seen.CanvasScene = function(elementId, scene, width, height) {
    if (width == null) {
      width = 400;
    }
    if (height == null) {
      height = 400;
    }
    return new seen.CanvasCanvas(scene, document.getElementById(elementId)).layer('background', new seen.CanvasFillRect(width, height)).layer('scene', new seen.CanvasRenderer(width, height));
  };

  seen.Scene = (function() {
    Scene.prototype.defaults = {
      cullBackfaces: true,
      camera: new seen.Camera(),
      model: new seen.Model(),
      shader: seen.Shaders.phong
    };

    function Scene(options) {
      this._renderSurfaces = __bind(this._renderSurfaces, this);
      this.render = __bind(this.render, this);
      seen.Util.defaults(this, options, this.defaults);
      this.dispatch = seen.Events.dispatch('beforeRender', 'afterRender', 'render');
      this.on = this.dispatch.on;
      this._renderModelCache = {};
    }

    Scene.prototype.startRenderLoop = function(msecDelay) {
      if (msecDelay == null) {
        msecDelay = 30;
      }
      return setInterval(this.render, msecDelay);
    };

    Scene.prototype.render = function() {
      var renderModels;
      this.dispatch.beforeRender();
      renderModels = this._renderSurfaces();
      this.dispatch.render(renderModels);
      this.dispatch.afterRender(renderModels);
      return this;
    };

    Scene.prototype._renderSurfaces = function() {
      var projection, renderModels,
        _this = this;
      projection = this.camera.getMatrix();
      renderModels = [];
      this.model.eachRenderable(function(light, transform) {
        return new seen.LightRenderModel(light, transform);
      }, function(shape, lights, transform) {
        var renderModel, surface, _i, _len, _ref6, _ref7, _ref8, _results;
        _ref6 = shape.surfaces;
        _results = [];
        for (_i = 0, _len = _ref6.length; _i < _len; _i++) {
          surface = _ref6[_i];
          renderModel = _this._renderSurface(surface, transform, projection);
          if (!_this.cullBackfaces || !surface.cullBackfaces || renderModel.projected.normal.z < 0) {
            renderModel.fill = (_ref7 = surface.fill) != null ? _ref7.render(lights, _this.shader, renderModel.transformed) : void 0;
            renderModel.stroke = (_ref8 = surface.stroke) != null ? _ref8.render(lights, _this.shader, renderModel.transformed) : void 0;
            _results.push(renderModels.push(renderModel));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      });
      renderModels.sort(function(a, b) {
        return b.projected.barycenter.z - a.projected.barycenter.z;
      });
      return renderModels;
    };

    Scene.prototype._renderSurface = function(surface, transform, projection) {
      var renderModel;
      renderModel = this._renderModelCache[surface.id];
      if (renderModel == null) {
        renderModel = this._renderModelCache[surface.id] = new seen.RenderModel(surface, transform, projection);
      } else {
        renderModel.update(transform, projection);
      }
      return renderModel;
    };

    return Scene;

  })();

}).call(this);
