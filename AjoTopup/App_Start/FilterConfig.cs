using System.Web;
using System.Web.Helpers;
using System.Web.Mvc;

namespace AjoTopup
{
    public class FilterConfig
    {
        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
            filters.Add(new HandleErrorAttribute());
            // filters.Add(new ValidateAntiForgeryTokenOnPost());
        }

        public class ValidateAntiForgeryTokenOnPost : IAuthorizationFilter
        {
            public void OnAuthorization(AuthorizationContext filterContext)
            {
                if (filterContext.HttpContext.Request.HttpMethod != "GET")
                {
                    AntiForgery.Validate();
                }
            }
        }
    }
}

