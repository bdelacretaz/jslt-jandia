/*
  Super-lightweight JSON-to-JSON transformations

  Author: Cyril Jandia (02/2016)

  Public Domain.

  NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
  
  ( See also: https://jsfiddle.net/YSharpLanguage/kj9pk8oz/10 )
*/
JSLT();

// (A "Company" is just an object with a "Team")
function Company(obj) {
  return obj.team && Team(obj.team);
}
    
// (A "Team" is just a non-empty array that contains at least one "Member")
function Team(obj) {
  return ({ }.toString.call(obj) === "[object Array]") &&
         obj.length &&
         obj.find(function(item) { return Member(item); });
}
    
// (A "Member" must have first and last names, and a gender)
function Member(obj) {
  return obj.first && obj.last && obj.sex;
}
    
function Dude(obj) {
  return Member(obj) && (obj.sex === "Male");
}
    
function Girl(obj) {
  return Member(obj) && (obj.sex === "Female");
}
    
var data = { team: [
  { first: "John", last: "Smith", sex: "Male" },
  { first: "Vaio", last: "Sony" },
  { first: "Anna", last: "Smith", sex: "Female" },
  { first: "Peter", last: "Olsen", sex: "Male" }
] };
    
var transform = { $: [
    
  [ [ Company ],
    function(company) {
      return { some_virtual_dom: {
        the_dudes: { ul: company.team.select(Dude).through(this) },
        the_grrls: { ul: company.team.select(Girl).through(this) }
      } }
    } ],

  [ [ Member ],
    function(member) {
      return { li: "{first} {last} ({sex})".of(member) };
    } ]
    
] };

console.log(JSON.stringify(data.through(transform), null, 2));

/* TODO the JSLT code should be factored out in its own module */
function JSLT() {

function dataset(obj) {
  var extension = { groupBy: groupBy, orderBy: orderBy },
      extend = function(o, x) {
        for (var p in x) {
          if (x.hasOwnProperty(p) && (typeof x[p] === "function")) {
            o[p] = x[p].bind(o);
          }
        }
        return o;
      };
  return extend(obj, extension);
}

function groupBy() {
  var args = [ ].slice.call(arguments),
      spec = ((typeof args[0] === "function") || (typeof args[0] === "string") ? args[0] : null),
      groupOf = function(v) {
        var j = groups.length;
        while (--j >= 0) {
          var a = groups[j];
          if (v === a[0]) {
            return a[1];
          }
        }
        return null;
      },
      groups = [ ];
  if (spec !== null) {
    for (var i = 0; i < this.length; i++) {
      var o = this[i];
      if (typeof o !== "undefined") {
        var k = undefined;
        if (typeof spec !== "function") {
          if (o.hasOwnProperty(spec)) {
            k = o[spec];
          }
        } else {
          k = spec(o);
        }
        if (typeof k !== "undefined") {
          var g = groupOf(k);
          if (g) {
            if (g.indexOf(o) < 0) {
              g.push(o);
            }
          } else {
            groups.push([ k, [ o ] ]);
          }
        }
      }
    }
    return function(v) {
       var group;
       return dataset(
         (
           typeof v !== "undefined" ?
           (
             typeof v === "function" ?
             groups.map(v)
             :
             groupOf(v)
           )
           :
           groups
         ) ||
         [ ]
       );
    };
  }
  return function() { return dataset([ ]); };
}

function orderBy() {
  var args = [ ].slice.call(arguments),
      spec = ((typeof args[0] === "function") || (typeof args[0] === "string") ? args[0] : null),
      order;
  return dataset
  (
    spec !== null ?
    this.slice(0).sort
    (
      typeof spec !== "function" ?
      (
        typeof (order = args[1]) !== "function" ?
        function(a, b) { return a[spec] < b[spec] ? -1 : 1; }
        :
        function(a, b) { return order(a[spec], b[spec]); }
      )
      :
      spec
    )
    :
    this.slice(0)
  );
}

String.prototype.of = function(obj, separator) {
  var isHash = function(o) { return o &&
        (typeof o !== "boolean") &&
        (typeof o !== "number") &&
        (typeof o !== "string") &&
        (typeof o !== "function");
      },
      s = this;
  separator = separator || "";
  if ({ }.toString.call(obj) === "[object Array]") {
    s = s.replace(/\{\*\}/g, obj.join(separator));
  }
  if (isHash(obj)) {
    for (var p in obj) {
      if (obj.hasOwnProperty(p)) {
        s = s.replace(new RegExp("\\{" + p + "\\}", "g"), obj[p]);
      }
    }
  }
  return s;
};

Array.prototype.nodeset = function() {
  var isArray = function(obj) { return { }.toString.call(obj) === "[object Array]"; },
      isHash = function(obj) { return obj &&
        (typeof obj !== "boolean") &&
        (typeof obj !== "number") &&
        (typeof obj !== "string") &&
        (typeof obj !== "function");
      },
      clone = function(obj, deep) {
        if (obj != null) {
          if (!isArray(obj)) {
            if (isHash(obj)) {
              var result = { };
              for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                  result[p] = deep ? clone(obj[p], deep) : obj[p];
                }
              }
              return result;
            } else {
              return obj;
            }
          } else {
            return obj.map(function(v) { return clone(v, deep); });
          }
        } else {
          return obj;
        }
      },
      args = [ ].slice.call(arguments),
      test = (typeof args[0] === "function" ? args[0] : null),
      rcrs = (test ? args[1] : args[0]),
      walk = function(o, p, k, a) {
        var l = isArray(o),
            r = !a,
            c;
        a = a || [ ];
        if ((!test && !(r && l)) || (test && test(o))) {
          a.push({ parent: p, key: k, value: o });
        }
        c = l ? { parent: p, key: k, value: o } : o;
        if (isHash(o) && (rcrs || (r && l))) {
          for (p in o) {
            if (o.hasOwnProperty(p)) {
              walk(o[p], c, p, a);
            }
          }
        }
        return a;
      };
  return dataset(walk(clone(this, true)));
};

Array.prototype.select = function() {
  return dataset([ ].nodeset.apply(this, arguments).map(function(node) { return node.value; }));
};

/*
  Cf. https://www.w3.org/TR/xslt#section-Processing-Model
*/
Object.prototype.through = function(transform, name) {
  var isArray = function(obj) { return { }.toString.call(obj) === "[object Array]"; },
      template = function(obj) {
        var i, match;
        if (typeof name === "string") {
          for (i = 0; i < rules.length; i++) {
            match = rules[i];
            if (name === match[0][0]) {
              return match[1];
            }
          }
          throw new Error("Rule not found: " + name);
        }
        for (i = 0; i < rules.length; i++) {
          match = rules[i];
          if (match[0][typeof match[0][0] === "string" ? 1 : 0](obj)) {
            return match[1];
          }
        }
        return function(o) { return isArray(o) ? o.map(function(v) { return v.through(transform); }) : o; }
      },
      rules;
  return transform && isArray(rules = transform.$) ?
         [ this ].reduce(function(result, c, r, l) {
           return typeof (r = template(c).call(transform, c, l)) !== "undefined" ? r : result;
         }, null)
         :
         this;
};

}
