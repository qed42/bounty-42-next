import Link from "next/link"
import Image from "next/image";

export function Footer() {
  const navigationItems = [
    { title: "Home", href: "/" },
    { title: "Projects", href: "/project" },
  ];

  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <Link href="/" className="mb-4 block">
              <Image
                src="/QED42 logo.svg"
                alt="Logo"
                width={150}
                height={50}
                className="inline-block mr-2"
              />
            </Link>
            <p className="text-muted-foreground xl:mr-10">Building amazing digital experiences for businesses worldwide.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-primary">Quick Links</h4>
            <div className="flex flex-col space-y-2">
              {navigationItems.map(item => (
                <Link key={item.href} href={item.href} className="inline-block no-underline text-muted-foreground hover:text-foreground">
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4 text-primary">Contact</h4>
            <div className="flex flex-col space-y-2 text-muted-foreground">
              <Link href="mailto:business@qed42.com" className="inline-block no-underline text-muted-foreground hover:text-foreground">business@qed42.com</Link>
              <Link href="tel:+15551234567" className="inline-block no-underline text-muted-foreground hover:text-foreground">+1 (555) 123-4567</Link>
              <Link href="https://www.linkedin.com/company/qed42" className="inline-block no-underline text-muted-foreground hover:text-foreground">LinkedIn</Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; QED42 2025. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
