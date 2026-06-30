using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.Script.Serialization;

namespace AjoTopup.Models
{
    public abstract class BaseSqlServer
    {

        public struct returnResult
        {
            public bool result;
            public string msg;
            public object data;
        }
        public struct gridResults
        {
            public int page;
            public int total;
            public long exectimems;
            public List<Dictionary<string, object>> rows;
            public Dictionary<string, object> grandTotal;
            public object obj;
        }

        public class sqlResult
        {
            public string conStr = ConfigurationManager.ConnectionStrings["conStr"].ConnectionString;

            public sqlResult(string con = ""){
                if (con != "")
                {
                    conStr = ConfigurationManager.ConnectionStrings[""+ con + ""].ConnectionString;
                }

            }

            #region SQL SERVER 

            public DataTable getExecuteQuery(string sql)
            {
                try
                {
                    SqlConnection cn = new SqlConnection(conStr);


                    SqlDataAdapter DA = new SqlDataAdapter(sql, cn);
                    DA.SelectCommand.CommandTimeout = 0;
                    DataTable sqlData = new DataTable();
                    DA.Fill(sqlData);


                    return sqlData;
                }
                catch (Exception exception)
                {
                    var strException = "Exception: " + exception.GetType()
                     + "\r\nInnerException: " + exception.InnerException
                     + "\r\nMessage: " + exception.Message
                     + "\r\nStackTrace: " + exception.StackTrace
                     + "\r\nSQL: " + sql;

                    throw new System.ArgumentException(strException, "original");

                }
            }
  

            public gridResults getDataGrid(Dictionary<string, object> grdParam, string sql, int isgroup = 0, string sqlCount = "")
            {
                var watch = System.Diagnostics.Stopwatch.StartNew();

                int page = Convert.ToInt32(grdParam["page"]);
                int rows = Convert.ToInt32(grdParam["rows"]);
               
                string sort = grdParam.ContainsKey("sort") ? (grdParam["sort"] != null ? grdParam["sort"].ToString() : "") : "";
                string order = grdParam.ContainsKey("order") ? (grdParam["order"] != null ? grdParam["order"].ToString() : "") : "";

                string filterRules = grdParam.ContainsKey("filterRules") ? (grdParam["filterRules"] != null ? grdParam["filterRules"].ToString() : "") : "";
                string filterCustom = grdParam.ContainsKey("filterCustom") ? (grdParam["filterCustom"] != null ? grdParam["filterCustom"].ToString() : "") : "";

                string orderBy = ""; 
                string sqlGrid = sql;

                sqlGrid = this.filterGrid(filterRules, sql);
                sqlGrid = this.filterGrid(filterCustom, sqlGrid);

                if (isgroup == 1)
                {
                    sqlGrid = this.filterGridGroup(filterRules, sql);
                    sqlGrid = this.filterGridGroup(filterCustom, sqlGrid);

                }

                int dataCount = 0;

                if (sqlCount != "")
                {
                    string sqlGridCount = sqlCount;
                    sqlGridCount = this.filterGridGroup(filterRules, sqlCount);
                    sqlGridCount = this.filterGridGroup(filterCustom, sqlGridCount);

                    if (isgroup == 1)
                    {
                        sqlGridCount = this.filterGridGroup(filterRules, sqlCount);
                        sqlGridCount = this.filterGridGroup(filterCustom, sqlGridCount);

                    }

                    dataCount = getDataCountQuery(sqlGridCount);
                }
                else
                {
                    dataCount = getDataCount(sqlGrid);
                }

                if (sort != "")
                {

                    string[] sortArr = sort.Split(',');
                    var sortStr = "";
                    if (sortArr.Length > 0)
                    {
                        string[] sortByArr = order.Split(',');
                        for (int i = 0; i < sortArr.Length; i++)
                        {
                            sortStr += string.Concat(sortArr[i], " " + sortByArr[i], (i == (sortArr.Length - 1) ? " " : ", "));
                        }
                        orderBy = sortStr;
                    }
                    else
                    {
                        orderBy = sort + " " + (order == "" ? "asc" : order);
                    }
                    sqlGrid += " order by " + orderBy;
                }
                else
                {
                    sqlGrid += " order by id asc " + orderBy;
                }

                if (page > 0 && rows > 0)
                {
                    int offset = (rows * page) - rows;
                    offset = (offset < 0 ? 0 : offset);
                    sqlGrid += " OFFSET " + offset.ToString()  + " ROWS FETCH NEXT " + rows.ToString()  + "  ROWS ONLY ";
                 }

                string sqlKirim = sqlGrid;
                List<Dictionary<string, object>> resData = getDataList(sqlGrid);
                gridResults resGrid = new gridResults();
                resGrid.rows = resData;
                resGrid.page = page;
                resGrid.total = dataCount;
                watch.Stop();
                resGrid.exectimems = watch.ElapsedMilliseconds;
                return resGrid;
            }

            public gridResults getDataGridGroupBy(Dictionary<string, object> grdParam, string sql, string grpBy = "")
            {
                var watch = System.Diagnostics.Stopwatch.StartNew();

                int page = Convert.ToInt32(grdParam["page"]);
                int rows = Convert.ToInt32(grdParam["rows"]);
                //string sort = grdParam["sort"].ToString();
                //string order = grdParam["order"].ToString();

                string sort = grdParam.ContainsKey("sort") ? (grdParam["sort"] != null ? grdParam["sort"].ToString() : "") : "";
                string order = grdParam.ContainsKey("order") ? (grdParam["order"] != null ? grdParam["order"].ToString() : "") : "";

                string filterRules = grdParam.ContainsKey("filterRules") ? (grdParam["filterRules"] != null ? grdParam["filterRules"].ToString() : "") : "";
                string filterCustom = grdParam.ContainsKey("filterCustom") ? (grdParam["filterCustom"] != null ? grdParam["filterCustom"].ToString() : "") : "";

                string orderBy = "";
                string sqlGrid = sql;

                sqlGrid = this.filterGrid(filterRules, sql);
                sqlGrid = this.filterGrid(filterCustom, sqlGrid);
                if (grpBy != "")
                {
                    sqlGrid += " group by " + grpBy;
                }
                int dataCount = getDataCount(sqlGrid);

                if (sort != "")
                {

                    string[] sortArr = sort.Split(',');
                    var sortStr = "";
                    if (sortArr.Length > 0)
                    {
                        string[] sortByArr = order.Split(',');
                        for (int i = 0; i < sortArr.Length; i++)
                        {
                            sortStr += string.Concat(sortArr[i], " " + sortByArr[i], (i == (sortArr.Length - 1) ? " " : ", "));
                        }
                        orderBy = sortStr;
                    }
                    else
                    {
                        orderBy = sort + " " + (order == "" ? "asc" : order);
                    }
                    sqlGrid += " order by " + orderBy;
                }

                if (page > 0 && rows > 0)
                {
                    int offset = (rows * page) - rows;
                    offset = (offset < 0 ? 0 : offset);
                    sqlGrid += " limit " + rows.ToString() + " offset " + offset.ToString();
                }

                List<Dictionary<string, object>> resData = getDataList(sqlGrid);
                gridResults resGrid = new gridResults();
                resGrid.rows = resData;
                resGrid.page = page;
                resGrid.total = dataCount;
                resGrid.obj = sqlGrid;
                watch.Stop();
                resGrid.exectimems = watch.ElapsedMilliseconds;
                return resGrid;
            }

            public List<Dictionary<string, object>> getDataList(string sql)
            {
                DataTable sqlData = getExecuteQuery(sql);
                List<Dictionary<string, object>> resData = new List<Dictionary<string, object>>();
                var sessIsadmin = System.Web.HttpContext.Current.Session["isadmin"];
                if (sessIsadmin != null)
                {

                    if (Convert.ToInt32(sessIsadmin) == 0)
                    {
                        DataColumnCollection columnslaba = sqlData.Columns;
                        //if (columnslaba.Contains("laba"))
                        //    sqlData.Columns.Remove("laba");
                    } 
                }
                

                //added by Eric #19012022
                var columns = sqlData.Columns.Cast<DataColumn>();
                resData.AddRange(sqlData.AsEnumerable().Select(dataRow => columns.Select(column =>
                      new { Column = column.ColumnName, Value = dataRow[column] })
                      .ToDictionary(data => data.Column, data => data.Value)).ToList());

                return resData;
            }

            public Dictionary<string, object> getDataRow(string sql)
            {
                DataTable sqlData = getExecuteQuery(sql);
                Dictionary<string, object> resData = new Dictionary<string, object>();
                resData = new Dictionary<string, object>();
                if (sqlData.Rows.Count > 0)
                {
                    foreach (DataColumn col in sqlData.Columns)
                    {
                        resData.Add(col.ColumnName, sqlData.Rows[0][col]);
                    }
                }

                return resData;
            }

            public int getDataCount(string sql)
            {
                DataTable sqlData = getExecuteQuery(sql);
                return sqlData.Rows.Count;
            }

            public int getDataCountQuery(string sql)
            {
                DataTable sqlData = getExecuteQuery(sql);
                return Convert.ToInt32(sqlData.Rows[0].ItemArray[0].ToString());
            }

            public string filterGridGroup(string filterRules, string sql)
            {
                string res = sql;

                if (filterRules != "")
                {
                    Dictionary<string, string> dicOps = new Dictionary<string, string>();
                    dicOps.Add("equal", "=");
                    dicOps.Add("notequal", "<>");
                    dicOps.Add("less", "<");
                    dicOps.Add("lessorequal", "<=");
                    dicOps.Add("greater", ">");
                    dicOps.Add("greaterorequal", ">=");
                    dicOps.Add("beginwith", "like");
                    dicOps.Add("endwith", "like");
                    dicOps.Add("contains", "like");
                    dicOps.Add("notcontains", "not like");
                    dicOps.Add("=", "=");

                    string strFilter = " and ";
                    //if (sql.Contains("where")) strFilter = "and ";
                    JavaScriptSerializer serialize = new JavaScriptSerializer();
                    List<Dictionary<string, object>> lstFilter = serialize.Deserialize<List<Dictionary<string, object>>>(filterRules);
                    if (lstFilter.Count > 0)
                    {
                        int i = 0;
                        foreach (var dicFilter in lstFilter)
                        {
                            if (dicFilter.ContainsKey("op"))
                            {
                                switch (dicFilter["op"].ToString())
                                {
                                    case "beginwith":
                                    case "notbeginwith":
                                        dicFilter["value"] = "" + dicFilter["value"] + "%";
                                        break;
                                    case "endwith":
                                    case "notendwith":
                                        dicFilter["value"] = "%" + dicFilter["value"] + "";
                                        break;
                                    case "contains":
                                    case "notcontains":
                                        dicFilter["value"] = "%" + dicFilter["value"] + "%";
                                        break;
                                }
                            }
                            else
                            {
                                dicFilter.Add("op", "=");
                            }

                            if (i == 0)
                            {
                                strFilter += dicFilter["field"] + " " + dicOps[dicFilter["op"].ToString()] + " '" + dicFilter["value"] + "'";
                            }
                            else
                            {
                                strFilter += " and " + dicFilter["field"] + " " + dicOps[dicFilter["op"].ToString()] + " '" + dicFilter["value"] + "'";
                            }
                            i++;
                        }

                        res = res.Replace("1=1", " 1=1 " + strFilter);

                    }
                }

                return res;
            }


            public string filterGrid(string filterRules, string sql)
            {
                string res = sql;

                if (filterRules != "")
                {
                    if (filterRules != "[]")
                    {
                        Dictionary<string, string> dicOps = new Dictionary<string, string>();
                        dicOps.Add("equal", "=");
                        dicOps.Add("notequal", "<>");
                        dicOps.Add("less", "<");
                        dicOps.Add("lessorequal", "<=");
                        dicOps.Add("greater", ">");
                        dicOps.Add("greaterorequal", ">=");
                        dicOps.Add("beginwith", "like");
                        dicOps.Add("endwith", "like");
                        dicOps.Add("contains", "like");
                        dicOps.Add("notcontains", "not like");
                        dicOps.Add("=", "=");

                        string strFilter = "where ";
                        if (sql.Contains("where")) strFilter = "and ";
                        JavaScriptSerializer serialize = new JavaScriptSerializer();
                        List<Dictionary<string, object>> lstFilter = serialize.Deserialize<List<Dictionary<string, object>>>(filterRules);
                        if (lstFilter.Count > 0)
                        {
                            int i = 0;
                            foreach (var dicFilter in lstFilter)
                            {
                                if (dicFilter.ContainsKey("op"))
                                {
                                    switch (dicFilter["op"].ToString())
                                    {
                                        case "beginwith":
                                        case "notbeginwith":
                                            dicFilter["value"] = "" + dicFilter["value"] + "%";
                                            break;
                                        case "endwith":
                                        case "notendwith":
                                            dicFilter["value"] = "%" + dicFilter["value"] + "";
                                            break;
                                        case "contains":
                                        case "notcontains":
                                            dicFilter["value"] = "%" + dicFilter["value"] + "%";
                                            break;
                                    }
                                }
                                else
                                {
                                    dicFilter.Add("op", "=");
                                }

                                if (i == 0)
                                {
                                    strFilter += dicFilter["field"] + " " + dicOps[dicFilter["op"].ToString()] + " '" + dicFilter["value"] + "'";
                                }
                                else
                                {
                                    strFilter += " and " + dicFilter["field"] + " " + dicOps[dicFilter["op"].ToString()] + " '" + dicFilter["value"] + "'";
                                }
                                i++;
                            }

                            res += " " + strFilter;
                        }
                    }

                }

                return res;
            }

            public returnResult execSql(string sql)
            {
                returnResult res = new returnResult();
                SqlConnection cnn = new SqlConnection(conStr);
                SqlCommand cmd = new SqlCommand();


                cnn.Open();
                cmd.CommandTimeout = 360000;
                SqlTransaction trn = cnn.BeginTransaction();
                cmd.Connection = cnn;
                cmd.Transaction = trn;
                cmd.CommandText = sql;
                try
                { 
                    cmd.ExecuteNonQuery();
                    trn.Commit();
                    res.result = true;
                    res.msg = "";

                    cmd.Dispose();
                    cnn.Close();
                    cnn.Dispose();
                }
                catch (Exception e)
                {
                    trn.Rollback();
                    res.result = false;
                    res.msg = e.Message;

                    cmd.Dispose();
                    cnn.Close();
                    cnn.Dispose();
                }
                finally
                {


                }
                return res;
            }

            public returnResult execSqlNoTrx(string sql)
            {
                returnResult res = new returnResult();
                SqlConnection cnn = new SqlConnection(conStr);
                SqlCommand cmd = new SqlCommand();


                cnn.Open();
                cmd.CommandTimeout = 360000; 
                cmd.Connection = cnn; 
                cmd.CommandText = sql;
                try
                {
                    cmd.ExecuteNonQuery(); 
                    res.result = true;
                    res.msg = "";

                    cmd.Dispose();
                    cnn.Close();
                    cnn.Dispose();
                }
                catch (Exception e)
                { 
                    res.result = false;
                    res.msg = e.Message;

                    cmd.Dispose();
                    cnn.Close();
                    cnn.Dispose();
                }
                finally
                {


                }
                return res;
            }

            public SqlCommand queryInsert(SqlCommand cmd, string tblName, Dictionary<string, object> data, bool audit = true, bool autoinsert = false)
            {
                if (audit)
                {
                    var dtnow = DateTime.Now;
                    data.Add("create_user", HttpContext.Current.Session["userid"]);
                    data.Add("create_date", dtnow);
                    data.Add("update_user", HttpContext.Current.Session["userid"]);
                    data.Add("update_date", dtnow);
                }
                string sql = "";
                string[] arrFields = data.Keys.ToArray();
                string[] arrValues = new string[arrFields.Length];
                for (int i = 0; i < arrFields.Length; i++)
                {
                    arrValues[i] = string.Concat("@", arrFields[i]);
                }
                sql = "insert into " + tblName + " (\"" + string.Join("\", \"", arrFields) + "\") values (" + string.Join(", ", arrValues) + ")";
                //if (autoinsert == true)
                //{
                //    sql = sql + " RETURNING id";
                //}
                //HttpContext.Current.Response.Write(sql);
                //HttpContext.Current.Response.End();

                cmd.CommandText = sql;
                for (int i = 0; i < arrFields.Length; i++)
                {
                    if (data[arrFields[i]] == null)
                    {
                        cmd.Parameters.AddWithValue(arrValues[i], DBNull.Value);
                    }
                    else
                    {
                        cmd.Parameters.AddWithValue(arrValues[i], data[arrFields[i]]);
                    }
                }

                return cmd;
            }

            public SqlCommand queryUpdate(SqlCommand cmd, string tblName, Dictionary<string, object> data, string filter, Dictionary<string, object> filterValue = null, bool audit = true)
            {
                if (audit)
                {
                    data.Add("update_user", HttpContext.Current.Session["userid"]);
                    data.Add("update_date", DateTime.Now);
                }
                string sql = "";
                string[] arrValues = new string[data.Count];
                int i = 0;
                foreach (KeyValuePair<string, object> iData in data)
                {
                    arrValues[i] = string.Concat(iData.Key, "= @", iData.Key);
                    i++;
                }

                sql = "update " + tblName + " set " + string.Join(", ", arrValues) + (filter != "" ? " where " + filter : "");

                cmd.CommandText = sql;

                foreach (KeyValuePair<string, object> iData in data)
                {
                    if (iData.Value == null)
                    {
                        cmd.Parameters.AddWithValue(string.Concat("@", iData.Key), DBNull.Value);
                    }
                    else
                    {
                        cmd.Parameters.AddWithValue(string.Concat("@", iData.Key), iData.Value);
                    }
                }
                if (filterValue != null)
                {
                    foreach (KeyValuePair<string, object> iFilter in filterValue)
                    {
                        cmd.Parameters.AddWithValue(iFilter.Key, iFilter.Value);
                    }
                }

                return cmd;
            }
            public SqlCommand queryDelete(SqlCommand cmd, string tblName, string filter, Dictionary<string, object> filterValue = null)
            {
                string sql = "";
                sql = "delete from " + tblName + (filter != "" ? " where " + filter : "");
                cmd.CommandText = sql;
                if (filterValue != null)
                {
                    foreach (KeyValuePair<string, object> iFilter in filterValue)
                    {
                        cmd.Parameters.AddWithValue(iFilter.Key, iFilter.Value);
                    }
                }

                return cmd;
            }

            public returnResult insertData(string tblName, Dictionary<string, object> data, bool audit = true)
            { 
                returnResult res = new returnResult();
                SqlConnection cnn = new SqlConnection(conStr);
                SqlCommand cmd = new SqlCommand();

                cnn.Open();
                SqlTransaction trn = cnn.BeginTransaction();
                cmd.Connection = cnn;
                cmd.Transaction = trn;

                try
                {
                    cmd = queryInsert(cmd, tblName, data, audit);
                    cmd.ExecuteNonQuery();
                    trn.Commit();
                    res.result = true;
                    res.msg = "";
                }
                catch (Exception e)
                {
                    trn.Rollback();
                    res.result = false;
                    res.msg = e.Message;
                }
                finally
                {
                    cmd.Dispose();
                    cnn.Close();
                    cnn.Dispose();

                }

                return res;
            }
            public returnResult updateData(string tblName, Dictionary<string, object> data, string filter, Dictionary<string, object> filterValue = null, bool audit = true)
            {
                returnResult res = new returnResult(); 
                SqlConnection cnn = new SqlConnection(conStr);
                SqlCommand cmd = new SqlCommand(); 

                cnn.Open();
                SqlTransaction trn = cnn.BeginTransaction();
                cmd.Connection = cnn;
                cmd.Transaction = trn;

                try
                {
                    cmd = queryUpdate(cmd, tblName, data, filter, filterValue, audit);
                    cmd.ExecuteNonQuery();

                    trn.Commit();
                    res.result = true;
                    res.msg = "";
                }
                catch (Exception e)
                {
                    trn.Rollback();
                    res.result = false;
                    res.msg = e.Message;
                }
                finally
                {
                    cmd.Dispose();
                    cnn.Close();
                    cnn.Dispose();

                }

                return res;
            }

            public returnResult deleteData(string tblName, string filter, Dictionary<string, object> filterValue = null)
            {
                returnResult res = new returnResult(); 
                SqlConnection cnn = new SqlConnection(conStr);
                SqlCommand cmd = new SqlCommand();

                cnn.Open();
                SqlTransaction trn = cnn.BeginTransaction();
                cmd.Connection = cnn;
                cmd.Transaction = trn;

                try
                {

                    cmd = queryDelete(cmd, tblName, filter, filterValue);
                    cmd.ExecuteNonQuery();
                    trn.Commit();
                    res.result = true;
                    res.msg = "";
                }
                catch (Exception e)
                {
                    trn.Rollback();
                    res.result = false;
                    res.msg = e.Message;
                }
                finally
                {
                    cmd.Dispose();
                    cnn.Close();
                    cnn.Dispose();

                }

                return res;
            }


            //end
            #endregion
        }
    }
}
