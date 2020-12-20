function Matrix(rows, columns, arg) {
    if (Number.isNaN(Number(rows)) || Number.isNaN(Number(columns))) throw new TypeError('Number needed');
    if (arg.length !== rows) throw new Error('Columns Error');
    for (let i = 0; i < arg.length; i++) {
        if (arg[i].length !== columns) throw new Error('Rows Error');
    }

    this.matrix = arg;
    this.countRows = rows;
    this.countColumns = columns;
    this.square = rows === columns;
}

Matrix.prototype.el = function (r, c, newVal) {
    if (!Number.isNaN(Number(newVal))) this.matrix[r - 1][c - 1] = Number(newVal);
    return this.matrix[r -1][c - 1];
};

Matrix.prototype.row = function (r) {
    return this.matrix[r - 1];
};

Matrix.prototype.column = function (c) {
    var col = [];
    for (let i = 0; i < this.matrix.length; i++) {
        col.push(this.matrix[i][c - 1]);
    }
    return col;
};

function dot(arr1, arr2) {
    var res = 0;

    for (let i = 0; i < arr1.length; i++) {
        res += arr1[i] * arr2[i];
    }

    return res;
}

Matrix.multiply = function (mat1, mat2) {
    if (!(mat1 instanceof Matrix) || !(mat2 instanceof Matrix)) throw new TypeError('Matrices needed');
    if (mat1.countColumns !== mat2.countRows) throw new Error('Operation Error');

    var arrays = [];

    for (let i = 1; i <= mat1.countRows; i++) {
        arrays[i - 1] = [];
        for (let m = 1; m <= mat2.countColumns; m++) {
            arrays[i - 1].push(dot(mat1.row(i), mat2.column(m)));
        }
    }
    
    return new Matrix(mat1.countRows, mat2.countColumns, arrays);
};

function Aug(rows, columns, arg) {
    Matrix.call(this, rows, columns, arg);
}

Aug.prototype = Object.create(Matrix.prototype);

Aug.prototype.exchange = function (r1, r2) {
    var r1o = [...this.row(r1)],
        r2o = [...this.row(r2)];

    this.matrix[r1 - 1] = r2o;
    this.matrix[r2 - 1] = r1o;
};

Aug.prototype.sm = function (num, r) {
    var ro = [...this.row(r)];
    for (let i = 0; i < ro.length; i++) {
        ro[i] *= num;
    }
    this.matrix[r - 1] = ro;
};

Aug.prototype.sadd = function (num, r1, r2) {
    var r1o = [...this.row(r1)],
        r2n = [...this.row(r2)];

    for (let i = 0; i < r1o.length; i++) {
        r2n[i] += r1o[i] * num;
    }

    this.matrix[r2 - 1] = r2n;
};

Aug.prototype.getRREF = function () {
    var augN = new Aug(this.countRows, this.countColumns, [...this.matrix]),
        leadingVar = 0;

    for (let i = 0; i < augN.countColumns; i++) {
        let col = [...augN.column(i + 1)];
        col.splice(0, leadingVar);

        let state = nonZeroExist(col);

        if (!state.exists) continue;

        leadingVar++;

        let ind = state.index + leadingVar;

        augN.exchange(leadingVar, ind);
        [col[0], col[state.index]] = [col[state.index], col[0]];
        augN.sm(1/col[0], leadingVar);
        
        for (let m = 1; m <= augN.countRows; m++) {
            if (m === leadingVar) continue;
            augN.sadd(-augN.el(m, i + 1), leadingVar, m);
        }
    }

    return augN;
}

function LinearSystem(rows, columns, arg) {
    Aug.call(this, rows, columns, arg);
    this.RREF = this.getRREF();
    this.nonZeroRows = (function () {
        var num = 0;
        for (let m = 1; m <= this.RREF.countRows; m++) {
            let row = this.RREF.row(m);
            for (let k = 0; k < row.length; k++) {
                if (row[k] != 0) {
                    num++;
                    break;
                }
            }
        }
        return num;
    }).call(this);
    this.unknowns = this.RREF.countColumns - 1;
    this.leadVars = (function () {
        var num = 0
        for (let s = 1; s < this.RREF.countColumns; s++) {
            if (this.isLeadingVar(s)) num++
        }
        return num;
    }).call(this);

    this.consistent = this.leadVars === this.nonZeroRows;
    this.unique = this.consistent ? this.leadVars === this.unknowns : false;

    this.solution = this.unique ? this.RREF.column(this.RREF.countColumns) : undefined;
}

LinearSystem.prototype = Object.create(Aug.prototype);

LinearSystem.prototype.isLeadingVar = function (c) {
    var col = this.RREF.column(c),
        zeros = 0;
        ones = 0;
    for (let i = 0; i < col.length; i++) {
        if (col[i] === 0) zeros++;
        if (col[i] === 1) ones++;
    }

    return (ones === 1) && (zeros === col.length - 1);
}

function nonZeroExist(arr) {
    var state = {
        exists: false,
        index: -1
    };

    for (let i = 0; i < arr.length; i++) {
        if (arr[i] !== 0) {
            state.exists = true;
            state.index = i;
            break;
        }
    }

    return state;
}
