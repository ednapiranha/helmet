String.prototype.trim = function() {
  return this.replace(/^\s+|\s+$/g,"");
};

String.prototype.ltrim = function() {
  return this.replace(/^\s+/,"");
};

String.prototype.rtrim = function() {
  return this.replace(/\s+$/,"");
};

function CSPViewModel() {
  this.directives = ['default-src','script-src','img-src','object-src','style-src','media-src','frame-src','font-src','connect-src'];
  this.selectedDirective = ko.observable();
  this.policy = ko.observableDictionary();
  this['default-src'] = ko.observable();
  this['script-src'] = ko.observable();
  this['img-src'] = ko.observable(); 
  this['object-src'] = ko.observable(); 
  this['style-src'] = ko.observable(); 
  this['media-src'] = ko.observable(); 
  this['frame-src'] = ko.observable(); 
  this['font-src'] = ko.observable(); 
  this['connect-src'] = ko.observable(); 
  this['report-uri'] = ko.observable('/helmet/violation');

  var self = this;
  
  this.addNewDirective = function () {
    console.log(self.policy.get(self.selectedDirective())());
    var dir = self.policy.get(self.selectedDirective())();
    if (! dir) {
      self.policy.set(self.selectedDirective(),[]);
    } else {
      // Already added
      console.log('You already added this directive');
    }
  };
  
  this.removeSource = function (data, event) {
      var directive = self.policy.get(event.target.name)();
      directive.splice(directive.indexOf(data),1);

      // Delete the section if it's blank 
      if (directive.length === 0) {
        self.policy.remove(event.target.name);
      } else {
        self.policy.set(event.target.name, directive); 
      }
  };
  
  this.addSource = function (data, event) {
    if (event.target && event.target.id) {
      var directiveName = event.target.id;
      var directive = self.policy.get(directiveName)();
      
      if (event.target.id && self[event.target.id]()) {
        var value = self[event.target.id]().trim();
        if (directive.indexOf(value) === -1 && value !== '') {
          // Doesn't exist in policy, adding.
          
          // Compensate for people that want to type self instead of 'self'
          if (value === 'self') { 
            value = "'self'";
          }
          
          directive.push(value);
          self.policy.set(directiveName, directive);
          self[event.target.id]('');
        }
      }
    }
  };

  this.save = function () {
    var policy = self.policy.toJSON();
    policy['report-uri'] = self['report-uri']();
    $.post('/helmet/policy.json', policy, function (data) {
        console.log(data);
    });
  };

    // Load in policy data
    $.getJSON("/helmet/policy.json", function (data) {
        for(var key in data){
            if (data.hasOwnProperty(key)){
                var value=data[key];
                if (key === 'report-uri') {
                    self['report-uri'](value);
                } else {
                    self.policy.set(key, value);
                }
            }
        }
    });
}

var csp = new CSPViewModel();
ko.applyBindings(csp);

