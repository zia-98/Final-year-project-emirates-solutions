import codecs
import re
from pathlib import Path

path = Path(__file__).resolve().parent / 'src' / 'pages' / 'CheckoutPage.tsx'

with codecs.open(path, 'r', 'utf-8') as f:
    content = f.read()

# 1. Comment out useEffects
content = re.sub(
    r'(  // Load Google Maps script\s+useEffect.*?}, \[googleLoaded\];)',
    r'  /* Uncomment to use real Maps API\n\g<1>\n  */',
    content,
    flags=re.DOTALL
)

# 2. Replace handleUseCurrentLocation
new_handler = """  const handleUseCurrentLocation = () => {
    setLocationLoading(true);
    setTimeout(() => {
      setShippingInfo(prev => ({
        ...prev,
        address: "IT Department, Finolex Academy of Management and Technology",
        city: "Ratnagiri",
        state: "Maharashtra",
        zipCode: "415612",
        country: "India"
      }));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.address;
        delete newErrors.city;
        delete newErrors.state;
        delete newErrors.zipCode;
        delete newErrors.country;
        return newErrors;
      });
      setLocationLoading(false);
      toast.success("Location filled successfully!");
    }, 300);
  };"""

content = re.sub(
    r'  const handleUseCurrentLocation = \(\) => \{.+?    \);.*?  \};',
    new_handler,
    content,
    flags=re.DOTALL
)

# 3. Add iframe and modify button text
iframe_html = """Use Finolex Location
                        </Button>
                      </div>
                      <div className="rounded-md overflow-hidden border my-2">
                        <iframe 
                          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3815.246889717215!2d73.33517927367937!3d17.01155571352629!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bea0cf716650747%3A0x62aba74500cb7f7b!2sIT%20Department%20Finolex%20Academy%20of%20Management%20and%20Technology!5e0!3m2!1sen!2sin!4v1776163891520!5m2!1sen!2sin" 
                          width="100%" 
                          height="200" 
                          style={{ border: 0 }} 
                          allowFullScreen={false} 
                          loading="lazy" 
                          referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                      </div>"""

content = content.replace('Use Current Location\n                        </Button>\n                      </div>', iframe_html)

with codecs.open(path, 'w', 'utf-8') as f:
    f.write(content)
print('Done!')
