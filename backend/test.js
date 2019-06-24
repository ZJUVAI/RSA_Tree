class test {
  constructor() {
    this.interp = 0;

    
    this.one = function() {
        console.log(this);
        console.log(this.interp)
      },
    this.two = function() {
        this.interp++;
      }
    
  }
}

module.exports = test;