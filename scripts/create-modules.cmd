@echo off
for %%M in (Identity Catalog Inventory Cart Ordering Review Wishlist Tracking Recommendation AI Analytics) do (
  echo === Tao module %%M ===
  dotnet new classlib -n LaptopCommerce.%%M.Domain         -o src\Modules\%%M\LaptopCommerce.%%M.Domain
  dotnet new classlib -n LaptopCommerce.%%M.Application    -o src\Modules\%%M\LaptopCommerce.%%M.Application
  dotnet new classlib -n LaptopCommerce.%%M.Infrastructure -o src\Modules\%%M\LaptopCommerce.%%M.Infrastructure
  dotnet new classlib -n LaptopCommerce.%%M.Endpoints      -o src\Modules\%%M\LaptopCommerce.%%M.Endpoints

  dotnet sln add src\Modules\%%M\LaptopCommerce.%%M.Domain
  dotnet sln add src\Modules\%%M\LaptopCommerce.%%M.Application
  dotnet sln add src\Modules\%%M\LaptopCommerce.%%M.Infrastructure
  dotnet sln add src\Modules\%%M\LaptopCommerce.%%M.Endpoints

  dotnet add src\Modules\%%M\LaptopCommerce.%%M.Application    reference src\Modules\%%M\LaptopCommerce.%%M.Domain
  dotnet add src\Modules\%%M\LaptopCommerce.%%M.Infrastructure reference src\Modules\%%M\LaptopCommerce.%%M.Application
  dotnet add src\Modules\%%M\LaptopCommerce.%%M.Endpoints      reference src\Modules\%%M\LaptopCommerce.%%M.Application
  dotnet add src\Modules\%%M\LaptopCommerce.%%M.Domain         reference src\BuildingBlocks\LaptopCommerce.SharedKernel
)
echo === Hoan tat ===
