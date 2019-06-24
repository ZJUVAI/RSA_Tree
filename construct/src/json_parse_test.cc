#include <gtest/gtest.h>
#include <nlohmann/json.hpp>
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
#include "SAT.h"
#include "parse.h"

using json = nlohmann::json;
using std::cout; using std::endl;
using std::vector;

namespace {

class ParseTest : public ::testing::Test {
 protected:

  void SetUp() override {
    std::ifstream input("json/poiParameter.json");
    json json_obj;
    input >> json_obj;
    sat._allDomain_min = scale_min;
    sat._allDomain_max = scale_max;
    parseParameter(json_obj, &sat, minn, maxx, &q);
    parseQuery(json_obj, &sat, Ask1, Ask2, answer, 1);
  }

  satStruct sat;
  static const int MM = 20;
  static const int N = 5e6 + 5;
  int scale_max[MM];
  int scale_min[MM];
  float maxx[MM];
  float minn[MM];
  int Ask1[MM], Ask2[MM];
  int answer[N];
  int q;
  int i = 0;
  int tot = 0;
  vector<int> expect_alldomainmin {0, 0};
  vector<int> expect_alldomainmax {8639, 8639};
  vector<float> expect_minn {119.237106323, 27.153964996};
  vector<float> expect_maxx {122.827102661, 31.179279327};
  vector<int> expect_cooLimitLength {1, 1};
  vector<int> expect_cooDivideNum {60, 60};
  vector<int> expect_innDivideNum {1};
};

TEST_F(ParseTest, dimCoordinate) {
  EXPECT_EQ(sat._dimCoordinate, 2);
}

TEST_F(ParseTest, dimInnNum) {
  EXPECT_EQ(sat._dimInnNum, 1);
}

TEST_F(ParseTest, allDomain_min) {
  EXPECT_EQ(std::equal(expect_alldomainmin.begin(), expect_alldomainmin.end(),
                       sat._allDomain_min), true);
}

TEST_F(ParseTest, allDomain_max) {
  EXPECT_EQ(std::equal(expect_alldomainmax.begin(), expect_alldomainmax.end(),
                       sat._allDomain_max), true);
}

TEST_F(ParseTest, minn) {
  EXPECT_EQ(std::equal(expect_minn.begin(), expect_minn.end(),
                       minn), true);
}

TEST_F(ParseTest, maxx) {
  EXPECT_EQ(std::equal(expect_maxx.begin(), expect_maxx.end(),
                       maxx), true);
}

TEST_F(ParseTest, cooLimitLength) {
  EXPECT_EQ(std::equal(expect_cooLimitLength.begin(), expect_cooLimitLength.end(),
                       sat._cooLimitLength), true);
}

TEST_F(ParseTest, cooDivideNum) {
  EXPECT_EQ(std::equal(expect_cooDivideNum.begin(), expect_cooDivideNum.end(),
                       sat._cooDivideNum), true);
}

TEST_F(ParseTest, innDivideNum) {
  EXPECT_EQ(std::equal(expect_innDivideNum.begin(), expect_innDivideNum.end(),
                       sat._innDivideNum), true);
}

TEST_F(ParseTest, dimInner) {
  EXPECT_EQ(sat._dimInner, 1);
}

TEST_F(ParseTest, q) {
  EXPECT_EQ(q, 1000);
}

TEST_F(ParseTest, useHash) {
  EXPECT_EQ(sat._useHash, false);
}

TEST_F(ParseTest, useDifference) {
  EXPECT_EQ(sat._useDiffernce, false);
}

TEST_F(ParseTest, useLayer) {
  EXPECT_EQ(sat._useLayer, false);
}

TEST_F(ParseTest, layerMul) {
  EXPECT_EQ(sat._layerMul, 12312233532);
}

TEST_F(ParseTest, Ask1) {
  EXPECT_EQ(Ask1[0], 480);
  EXPECT_EQ(Ask1[1], 3416);
}

TEST_F(ParseTest, Ask2) {
  EXPECT_EQ(Ask2[0], 6812);
  EXPECT_EQ(Ask2[1], 7454);
}

TEST_F(ParseTest, answer) {
  EXPECT_EQ(answer[0], 38818);
}

}  // namespace

int main(int argc, char **argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}