//  Modified May, 3, 2014

function RNG(){
    this.GetNormal = function(){
    	var u1 = Math.random();
    	var u2 = Math.random();
        return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
    }
}

function Estimators( n ){ // n = nubmer of random variables 
    // we are in the kth iteration
    var k = 0;      

    // declare
    var mean     = new Array(n);                
    var variance = new Array(n);    // copy the diag of the matrix cov defined below
    var cov      = new Array(n);
    for( var i=0 ; i<n ; i++ )  cov[i] = new Array(i+1);    // lower trianglar matrix

    // initialize
    for( var i=0 ; i<n ; i++ ){
        mean[i] = 0;    
        for( var j=0 ; j<=i ; j++ )  cov[i][j] = 0;
    }
    
    // member fnc
    this.SetEstimators = function( samples ){  // input an array, samples from {Y, C1, C2, ... }

        var dm = new Array(n);      // ( updated mean - mean ) is an important value that will be used later
                                    // so keep it in an array. 
        // updating mean
        for( var i=0 ; i<n ; i++ ){
            dm[i] = (samples[i] - mean[i])/(k+1);
            mean[i] += dm[i];
        }

        // updating covariance
        for( var i=0 ; i<n ; i++ )
            for( var j=0 ; j<=i ; j++ )
                (1-1/k)*cov[i][j] + (k+1)*dm[i]*dm[j];

        // updating variance 
        for( var i=0 ; i<n ; i++ )        
            variance[i] = cov[i][i];    // just copy the diag elements of cov
        
        // updating iteration index
        k++;
    }
}

function Axb( A, b ){   // Matrix A times vector b
    var n = b.length;
    var Ab = new Array(n);

    for( var i=0 ; i<n ; i++ ){
        Ab[i] = 0;
        for( var j=0 ; j<n ; j++ )
            Ab[i] += A[i][j]*b[j];
    }
    
    return Ab;   
}

// BLAS functions DOT, AXPY, XPAY, COPY, SCAL

function DOT( x, y ){
    var n = x.length;
    var tmp = 0;
    
    for(var i=0 ; i<n ; i++)    
        tmp += x[i]*y[i];
        
    return tmp;
}

function AXPY( a, x, y ){  //  y <- a x + y
    var n = x.length;    
    for( var i=0 ; i<n ; i++ )
        y[i] = a*x[i] + y[i];
}

function AXPY( a, x, y ){  //  y <- a x + y
    var n = x.length;    
    for( var i=0 ; i<n ; i++ )
        y[i] = a*x[i] + y[i];
}

function XPAY( a, x, y ){  //  y <- x + a y
    var n = x.length;    
    for( var i=0 ; i<n ; i++ )
        y[i] = x[i] + a*y[i];
}

function COPY( x, y ){  //  y <- x
    var n = x.length;
    for( var i=0 ; i<n ; i++ )
        y[i] = x[i];
}

function SCAL( a, x ){  //  x <- a x
    var n = x.length;
    for( var i=0 ; i<n ; i++ )
        x[i] = a*x[i];
}

function CGSolve( A, y ){
    var n = y.length;

    //  x = x0 = all zero
    var x = new Array(n); 
    for(var i=0 ; i<n ; i++)    x[i] = 0;
    
    //  If x0 is not zero , need to evaluate r = y - A x, 
    //  but now r = y
    //
    //  var r = Axb(A, x);    
    //  XPAY(-1, y, r);

    var r = new Array(n);  
    var p = new Array(n);
    COPY(y, r);         // 如果不用 COPY，直接 p = r, 等一下 p 跟 r 會同時被改變。
    COPY(r, p);         // 等於 p 和 r 只是不同的名字，實際上存到同一塊記憶體
        
    var c = DOT(r, r);
    var z, w, d;
    
    for(var i=0 ; i<20 ; i++ ){
        z = Axb(A, p);
        w = c/DOT(p, z);    // w : scalar
        XPAY(1/w, p, x);    // x = x + w*p      1. x = p + x/w
        SCAL(w, x);         //                  2. x = w*x

        AXPY(-w, z, r);
        if(DOT(r, r) < 0.00000000000001) break;
        d = DOT(r, r);
        XPAY(d/c, r, p);

        c = d;
    }
    
    return x;
}

function Pathgen( s0, r, s, T, n ){
    this.logS = new Array(n+1);
        
    // 只要有 this 指著就是 constructor 的一部份，下面寫的可以跑但觀念上是不完全正確
    this.Generate = function(){
        var dt = T/n;
        this.logS[0] = Math.log(s0);
        var u = new RNG();

        for(var i=1 ; i<=n ; i++)
            this.logS[i] = this.logS[i-1] + ((r-s*s/2)*dt + s*Math.sqrt(dt)*u.GetNormal())
    }

    this.Max = function(){
        var m = this.logS[0];
        for(var i=1 ; i<=n ; i++)
            if( this.logS[i]>m )
                m = this.logS[i];
        return Math.exp(m);
    }
    this.Min = function(){
    	var m = this.logS[0];
        for(var i=1 ; i<=n ; i++)
            if( this.logS[i]<m )
                m = this.logS[i];
        return Math.exp(m);
    }
    this.Avg = function(){
        var sum = Math.exp(this.logS[0]);
        for(var i=1 ; i<=n ; i++)  
            sum += Math.exp(this.logS[i]);
        return sum/(n+1);
    }
    this.GeoAvg = function(){	
        var sum = this.logS[0];
        for(var i=1 ; i<=n ; i++)
            sum += this.logS[i];
        return Math.exp(sum/(n+1));
    }
    this.Half = function(){ 
        return Math.exp(this.logS[Math.floor(n/2)]); 
    }
    this.Terminal = function(){ 
        return Math.exp(this.logS[n]); 
    }
    this.StepValue = function(k){ 
        return Math.exp(this.logS[k]); 
    }
}
