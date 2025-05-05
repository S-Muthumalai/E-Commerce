function math(){
    var b = [];
for(let i = 0; i < 3; i++) {
    b.push(()=>console.log(i));
}
print(b[0]()); // 3
print(b[1]()); // 3
print(b[2]()); // 3
}
math();