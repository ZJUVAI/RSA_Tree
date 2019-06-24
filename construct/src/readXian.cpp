
#include <stdlib.h>
#include <time.h>
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <unistd.h>
#include <ctime>
#include <iostream>
#include <map>
#include <memory>
#include <ctime>
#include <cstring>
#include <nlohmann/json.hpp>
#include "RTree.h"
#include "timer.h"
#include "parse.h"
#include "Query.h"
using namespace std;

// #define QUERY_QUEAL Query<1, int, 2, int, float, 10, 5, 8000, 4000, int>
#define QUERY_QUEAL Query<1, int, 5, int, float, 10, 5, 8000, 4000, int>
typedef long long ll;


int useStorge = 0;
void setParams(int argc, char ** argv) {
    int i;
    if ((i = ArgPos((char *) "-store", argc, argv)) > 0) useStorge = atoi(argv[i + 1]);
}


int main(int argc, char **argv) {
    setParams(argc, argv);
    
    QUERY_QUEAL query("json/xianParameter2.json", argc, argv);

    if(useStorge) {
        query.load("xian2");
    } else {
        query.insert("./data/Xian_Data2");
        // query.insert("./data/Xian_Data2_small", "./data/Xian_Data2_large");
        // query.save("xian2");
    }
    // query.query(10);
}