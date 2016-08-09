/*
  JSON transformations, revisited

  Author: Cyril Jandia (03/2016)

  Public Domain.

  NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */
 
/*
  Cf. https://www.w3.org/TR/xslt#section-Document-Example
*/
var D1document = {
    type: "document", title: [ "Document Title" ],
    "": [
      { type: "chapter", title: [ "Chapter Title" ],
        "": [
        { type: "section", title: [ "Section Title" ],
          "": [
            { type: "para", "": [ "This is a test." ] },
            { type: "note", "": [ "This is a note." ] }
        ] },
        { type: "section", title: [ "Another Section Title" ],
          "": [
            { type: "para", "": [ "This is ", { emph: "another" }, " test." ] },
            { type: "note", "": [ "This is another note." ] }
        ] }
      ] }
    ] };

console.log("From", JSON.stringify(D1document, null, 2));

var D1toHTML = { $: [
  [ [ function(node) { return node.type === "document"; } ],
    function(root) {
      return Per("<html>\r\n\
  <head>\r\n\
    <title>\r\n\
      {title}\r\n").map(root) + Per("\
    </title>\r\n\
  </head>\r\n\
  <body>\r\n\
{*}").map(Per(this).map(root[""])) + "\
  </body>\r\n\
</html>";
    }
  ],
  [ [ function(node) { return node.type === "chapter"; } ],
    function(chapter) {
      return Per("    <h2>{title}</h2>\r\n").map(chapter) + Per("{*}").map(Per(this).map(chapter[""]));
    }
  ],
  [ [ function(node) { return node.type === "section"; } ],
    function(section) {
      return Per("    <h3>{title}</h3>\r\n").map(section) + Per("{*}").map(Per(this).map(section[""]));
    }
  ],
  [ [ function(node) { return node.type === "para"; } ],
    function(para) {
      return Per("    <p>{*}</p>\r\n").map(Per(this).map(para[""]));
    }
  ],
  [ [ function(node) { return node.type === "note"; } ],
    function(note) {
      return Per('    <p class="note"><b>NOTE: </b>{*}</p>\r\n').map(Per(this).map(note[""]));
    }
  ],
  [ [ function(node) { return node.emph; } ],
    function(emph) {
      return Per("<em>{emph}</em>").map(emph);
    }
  ]
] };

console.log("To", Per(D1toHTML).map(D1document));

/*
  Cf. https://www.w3.org/TR/xslt#data-example
*/
var D2document =
    { sales: [ //<sales>...
      { id: "North", //<division>...
        revenue: 10,
        growth: 9,
        bonus: 7
      },
      { id: "South", //<division>...
        revenue: 4,
        growth: 3,
        bonus: 4
      },
      { id: "West", //<division>...
        revenue: 6,
        growth: -1.5,
        bonus: 2
      }
    ] };

console.log("**** Example 2");
console.log("From", JSON.stringify(D2document, null, 2));

var D2toHTML = { $: [
  [ [ function(node) { return typeof node.sales === "object"; } ],
    function(root) {
      return '<html>\r\n\
    <head>\r\n\
        <title>Sales Results By Division</title>\r\n\
    </head>\r\n\
    <body>\r\n\
        <table border="1">\r\n\
            <tr>\r\n\
                <th>Division</th>\r\n\
                <th>Revenue</th>\r\n\
                <th>Growth</th>\r\n\
                <th>Bonus</th>\r\n\
            </tr>' +
      Per(root.sales).orderBy("revenue", function(a, b) {
        return a > b ? -1 : 1;
      }).map(function(division) {
        division.style = division.growth < 0 ? ' style="color:red"' : '';
        return Per("\r\n\
                <tr>\r\n\
                    <td>\r\n\
                        <em>{id}</em>\r\n\
                    </td>\r\n\
                    <td>\r\n\
                        {revenue}\r\n\
                    </td>\r\n\
                    <td{style}>\r\n\
                        {growth}\r\n\
                    </td>\r\n\
                    <td>\r\n\
                        {bonus}\r\n\
                    </td>\r\n\
                </tr>").map(division);
      }).join("") + "\r\n\
        </table>\r\n\
    </body>\r\n\
</html>";
    } ]
] };

console.log("To", Per(D2toHTML).map(D2document));

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

function NotAMember(obj) {
  return !Member(obj);
}
    
var data = { team: [
  { first: "John", last: "Smith", sex: "Male" },
  { first: "Vaio", last: "Sony" },
  { first: "Anna", last: "Smith", sex: "Female" },
  { first: "Peter", last: "Olsen", sex: "Male" }
] };

console.log("**** Example 3");
console.log("From", JSON.stringify(data, null, 2));

var TO_SOMETHING_ELSE = { $: [
    
  [ [ Company ],
    function(company) {
      return { some_virtual_dom: {
        the_dudes: { ul: Per(this).map(Per(company.team).select(Dude)) },
        the_grrls: { ul: Per(this).map(Per(company.team).select(Girl)) }
      } }
    } ],

  [ [ Member ],
    function(member) {
      return {
        li: Per("{first} {last}").map(member) +
            " " +
            Per(this).map({ gender: member.sex })
      };
    } ],

  [ [ function(info) { return info.gender; } ],
    function(info) {
      info.pronoun = info.gender === "Male" ? "he" : "she";
      return Per("(it's a '{pronoun}')").map(info);
    } ]
    
] };

console.log("To", JSON.stringify(Per(TO_SOMETHING_ELSE).map(data), null, 2));

var groceries = {
     "prods": [
        {
            "info": {
                  "rate": 85
                    },
            "grocery": [
                     {
                      "brand": "C",
                      "brand_id": "984"
                     },
                     {
                      "brand": "D",
                      "brand_id": "254"
                     }
                     ],
             "discount": "15"
        },
        {
            "info": {
                  "rate": 100
                    },
            "grocery": [
                     {
                      "brand": "A",
                      "brand_id": "983"
                     },
                     {
                      "brand": "B",
                      "brand_id": "253"
                     }
                     ],
             "discount": "20"
         }
     ]
};

console.log("**** Example 4");
console.log("From", JSON.stringify(groceries, null, 2));

function GroceryItem(obj) {
  return (typeof obj.brand === "string") && (typeof obj.brand_id === "string");
}

var allBrandIDs = Per(groceries.prods).
      flattenBy(function(obj, key) {
        return key === "brand_id";
      }, true),

    itemsAndDiscounts = Per(groceries.prods).
      flatset(function(obj, key, parent) {
        return parent && parent.parent && parent.parent.discount;
      }, true).
      map(function(node) {
        return { id: node.value.brand_id, discount: node.parent.parent.discount };
      }),

    discountOfItem983 = itemsAndDiscounts.
      filter(function(item) {
        return item.id === "983";
      })
      [0].
      discount;

console.log("All brand IDs:", JSON.stringify(allBrandIDs, null, 2));
console.log("All items and discounts: ", JSON.stringify(itemsAndDiscounts, null, 2));
console.log("Discount of #983: ", discountOfItem983);

var store =
{
    store:'my store',
    items: [{
        name: 'Hammer',
        skus: [{
            num: '12345qwert'
        }]
    }, {
        name: 'Bike',
        skus: [{
            num: 'asdfghhj'
        }, {
            num: 'zxcvbn'
        }]
    }, {
        name: 'Fork',
        skus: [{
            num: '0987dfgh'
        }]
    }]
};

console.log("**** Example 5");
console.log("From", JSON.stringify(store, null, 2));

function SKU(node) {
  return typeof node.num === "string";
}

var all_skus =
    Per(store.items).
    nodeset(SKU, true).
    map(function(sku_node) {
      return {
        name: sku_node. // context node of (a sku), "{ num: ... }"
              parent. // container array (the skus), "[ { num: ... } ]"
              parent. // container object (an item), "{ name: ..., skus: [ ... ] }"
              name, // what we're interested in, for the result set
        sku: sku_node. // context node of (a sku), "{ num: ... }"
             value. // context node's actual value (a sku), "{ num: ... }"
             num // what we're interested in, for the result set
      };
    });
	
console.log("To", JSON.stringify(all_skus, null, 2));

var sales = [
  { "product" : "broiler", "store number" : 1, "quantity" : 20  },
  { "product" : "toaster", "store number" : 2, "quantity" : 100 },
  { "product" : "toaster", "store number" : 2, "quantity" : 50 },
  { "product" : "toaster", "store number" : 3, "quantity" : 50 },
  { "product" : "blender", "store number" : 3, "quantity" : 100 },
  { "product" : "blender", "store number" : 3, "quantity" : 150 },
  { "product" : "socks", "store number" : 1, "quantity" : 500 },
  { "product" : "socks", "store number" : 2, "quantity" : 10 },
  { "product" : "shirt", "store number" : 3, "quantity" : 10 }
];

var products = [
  { "name" : "broiler", "category" : "kitchen", "price" : 100, "cost" : 70 },
  { "name" : "toaster", "category" : "kitchen", "price" : 30, "cost" : 10 },
  { "name" : "blender", "category" : "kitchen", "price" : 50, "cost" : 25 },
  {  "name" : "socks", "category" : "clothes", "price" : 5, "cost" : 2 },
  { "name" : "shirt", "category" : "clothes", "price" : 10, "cost" : 3 }
];

var stores = [
  { "store number" : 1, "state" : "CA" },
  { "store number" : 2, "state" : "CA" },
  { "store number" : 3, "state" : "MA" },
  { "store number" : 4, "state" : "MA" }
];

console.log("**** Example 6");
console.log("From");
console.log("sales = ", JSON.stringify(sales, null, 2));
console.log("products = ", JSON.stringify(products, null, 2));
console.log("stores = ", JSON.stringify(stores, null, 2));

var nestedGroupingAndAggregate = Per(stores).groupBy("state")
( function(byState) {
    var state = byState[0],
        stateStores = byState[1];
    byState = { };
    return (
      (
        byState[state] =
        Per(products).orderBy("category").groupBy("category")
        ( function(byCategory) {
            var category = byCategory[0],
                categoryProducts = byCategory[1],
                categorySales = sales.filter(function(sale) {
                  return stateStores.find(function(store) { return sale["store number"] === store["store number"]; }) &&
                         categoryProducts.find(function(product) { return sale.product === product.name; });
                });
            byCategory = { };
            return (
              (
                byCategory[category] =
                Per(categorySales).orderBy("product").groupBy("product")
                ( function(byProduct) {
                    var soldProduct = byProduct[0],
                        soldQuantities = byProduct[1];
                    byProduct = { };
                    return (
                      (
                        byProduct[soldProduct] =
                        Per("{subTotal} item(s) sold").map
                        (
                        	{ subTotal: soldQuantities.reduce(function(sum, sale) {
                            return sum += sale.quantity;
                          }, 0) }
                        )
                      ),
                      byProduct
                    );
                } ) // byProduct()
              ),
              byCategory
            );
        } ) // byCategory()
      ),
      byState
    );
} ); // byState()

console.log("To", JSON.stringify(nestedGroupingAndAggregate, null, 2));

var cities = [
  { name: "Milano",  country: "Italia",      pop: 5 },
  { name: "Paris",   country: "France",      pop: 7 },
  { name: "München", country: "Deutschland", pop: 4 },
  { name: "Lyon",    country: "France",      pop: 2 },
  { name: "Venezia", country: "Italia",      pop: 1 }
];

console.log("**** Example 7");
console.log("From", JSON.stringify(cities, null, 2));

var xslt3_0example14_4 = Per('<table border="1">\r\n\
  <tr>\r\n\
    <th>Position</th>\r\n\
    <th>Country</th>\r\n\
    <th>City List</th>\r\n\
    <th>Population</th>\r\n\
  </tr>{*}\r\n\
</table>').map
  (
    Per(cities).groupBy("country")(function(byCountry, index) {
      var country = byCountry[0],
          cities = Per(byCountry[1]).orderBy("name");
      return Per("\r\n\
  <tr>\r\n\
    <td>{position}</td>\r\n\
    <td>{country}</td>\r\n\
    <td>{cities}</td>\r\n\
    <td>{population}</td>\r\n\
  </tr>").
        map({ position: index + 1, country: country,
             cities: cities.map(function(city) { return city.name; }).join(", "),
             population: cities.reduce(function(sum, city) { return sum += city.pop; }, 0)
           });
    })
  );

console.log("To", xslt3_0example14_4);

/* TODO the JSLT code should be factored out in its own module */
function Per() {
  var subject = [ ].slice.call(arguments)[0],
      isArray = function(obj) {
        return { }.toString.call(obj) === "[object Array]";
      },
      isHash = function(obj) {
        return obj &&
               (typeof obj !== "boolean") &&
               (typeof obj !== "number") &&
               (typeof obj !== "string") &&
               (typeof obj !== "function");
      },
      extend = function(obj, ext) {
        for (var p in ext) {
          if (ext.hasOwnProperty(p) && (typeof ext[p] === "function")) {
            obj[p] = ext[p].bind(obj);
          }
        }
        return obj;
      },
      subject = [ ].slice.call(arguments)[0];
  /*
    Extended array:
   */
  if (isArray(subject)) {
    function extended(array) {
      return extend(
               array, {
                 contains: contains,
                 distinct: distinct,
                 flattenBy: flattenBy,
                 groupBy: groupBy,
                 orderBy: orderBy,
                 nodeset: nodeset,
                 flatset: flatset,
                 select: select
               }
             );
    }
    function same(left, right) {
      return (left != null) &&
             (right != null) &&
             (typeof left._HERE_ !== "undefined") &&
             (typeof left.value !== "undefined") ?
             (
               (left._HERE_ === true) &&
               (left._HERE_ === right._HERE_) &&
               (left.value === right.value)
             )
             :
             left === right;
    }
    function has(array, value) {
      for (var i = 0; i < array.length; i++) {
        if (same(array[i], value)) {
          return true;
        }
      }
      return false;
    }
    function contains(value) {
      return has(this, value);
    }
    function distinct() {
      var result = [ ];
      for (var i = 0; i < this.length; i++) {
        var value = this[i];
        if (!has(result, value)) {
          result.push(value);
        }
      }
      return result;
    }
    function nodeset() {
      var args = [ ].slice.call(arguments),
          spec = (typeof args[0] === "function" ? args[0] : null),
          deep = (spec ? args[1] : args[0]),
          from = function(o, p, k, a) {
            var l = isArray(o),
                r = !a,
                c;
            a = a || [ ];
            if ((!spec && !(r && l)) || (spec && spec(o, k, p))) {
              a.push({ _HERE_: true, parent: p, key: k, value: o });
            }
            c = l ? { _HERE_: true, parent: p, key: k, value: o } : o;
            if (isHash(o) && (deep || (r && l))) {
              for (p in o) {
                if (o[p] != null) {
                  from(o[p], c, p, a);
                }
              }
            }
            return a;
          };
      return extended(from(this));
    }
    function flatset() {
      var args = [ ].slice.call(arguments),
          spec = (typeof args[0] === "function" ? args[0] : null),
          deep = (spec !== null ? args[1] : args[0]);
      spec = !spec ? function() { return true; } : spec;
      return extended(this.slice(0)).nodeset(spec, deep);
    }
    function flattenBy() {
      return extended(flatset.apply(this, arguments).map(function(node) { return node.value; }));
    }
    function groupBy() {
      var args = [ ].slice.call(arguments),
          spec = ((typeof args[0] === "function") || (typeof args[0] === "string") ? args[0] : null),
          groupOf = function(v) {
            var j = groups.length;
            while (--j >= 0) {
              var a = groups[j];
              if (same(v, a[0])) {
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
              if (typeof o[spec] !== "undefined") {
                k = o[spec];
              }
            } else {
              k = spec(o);
            }
            if (typeof k !== "undefined") {
              var g = groupOf(k);
              if (g) {
                if (!has(g, o)) {
                  g.push(o);
                }
              } else {
                groups.push([ k, [ o ] ]);
              }
            }
          }
        }
        return function(v) {
          return extended(
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
      return function() { return extended([ ]); };
    }
    function orderBy() {
      var args = [ ].slice.call(arguments),
          spec = ((typeof args[0] === "function") || (typeof args[0] === "string") ? args[0] : null),
          order;
      return extended(
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
    function select() {
      return extended(nodeset.apply(this, arguments).map(function(node) { return node.value; }));
    }
    return extended(subject.slice(0));
  }
  /*
    String interpolation
   */
    else if (typeof subject === "string") {
    function interpolate(obj, separator) {
      var s = this;
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
    }
    return { map: function() { return interpolate.apply(subject, arguments); } };
  }
  /*
    Transform ( cf. https://www.w3.org/TR/xslt#section-Processing-Model )
   */
    else if (isHash(subject) && subject.hasOwnProperty("$") && isArray(subject.$)) {
    var rule = [ ].slice.call(arguments)[1];
    function transform(source) {
      var template = function(obj) {
            var i, match;
            if (typeof rule === "string") {
              for (i = 0; i < rules.length; i++) {
                match = rules[i];
                if (rule === match[0][0]) {
                  return match[1];
                }
              }
              throw new Error("Rule not found: " + rule);
            }
            for (i = 0; i < rules.length; i++) {
              match = rules[i];
              if (match[0][typeof match[0][0] === "string" ? 1 : 0](obj)) {
                return match[1];
              }
            }
            return function(o) { return isArray(o) ? o.map(function(v) { return transform(v); }) : o; }
          },
          rules = subject.$;
      return [ source ].reduce(function(result, c, r, l) {
               return typeof (r = template(c).call(subject, c, l)) !== "undefined" ? r : result;
             }, null);
    }
    return { map: function(source) { return transform(source); } };
  }
  /*
    Identity
   */
    else {
    return subject;
  }
}
