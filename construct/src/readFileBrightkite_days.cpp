
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

#define QUERY_QUEAL Query<1, int, 5, int, float, 100, 50, 2000, 1000, int>
// #define QUERY_QUEAL Query<1, int, 2, int, float, 10, 5, 1000, 500, int>
typedef long long ll;


int useStorge = 0;
void setParams(int argc, char ** argv) {
    int i;
    if ((i = ArgPos((char *) "-store", argc, argv)) > 0) useStorge = atoi(argv[i + 1]);
}


int main(int argc, char **argv) {
    setParams(argc, argv);
    
    QUERY_QUEAL query("json/brightkiteParameter_days.json", argc, argv);

    if(useStorge) {
        query.load("brightkite_days");
    } else {
        query.insert("./data/brightkite_Data_days");
        // query.insert("./data/brightkite_Data_days_small", "./data/brightkite_Data_days_large");
        query.save("brightkite_days");
    }

    // query.query();
}