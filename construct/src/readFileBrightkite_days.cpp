
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
typedef long long ll;


int main(int argc, char **argv) {
    
    QUERY_QUEAL query("json/brightkiteParameter_days.json", argc, argv);

    query.insert("./data/BRIGHTKITE_SMALL");
    query.save("./result/brightkite_days");

}